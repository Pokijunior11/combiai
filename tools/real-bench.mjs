// MJERILO NA PRAVIM OTPREMNICAMA — korak 1 „Reseta motora" (PLAN.md §4).
//
// Svrha: dati BROJKE prije odluke o temelju motora. Ne mijenja ni redak motora.
// Isti izlaz kasnije mjeri i kandidate (container-loading solver, OR-Tools) na ISTIM podacima,
// pa je usporedba poštena.
//
// Pokretanje:  cd app && node ../tools/real-bench.mjs
// (iz `app/` jer se odande resolvaju `xlsx` i `.env` sa Supabase ključevima)
import fs from 'fs'
import { createRequire } from 'module'
import { parseOtpremnica, matchToCatalog } from '../app/src/lib/importOtpremnica.js'
import { computeBest } from '../app/src/lib/packer.js'

const require = createRequire(process.cwd() + '/package.json')
const XLSX = require('xlsx')
globalThis.XLSX = XLSX                     // parser očekuje xlsx dostupan kao u pregledniku

const ROOT = '..'
const EPS = 1e-6
const PALETTE = ['#e0783f', '#2f7dd1', '#4fa06a', '#b5539c']

// ── katalog iz Supabasea (isti izvor kao app) ──────────────────────────────
const env = fs.readFileSync('.env', 'utf8')
const URL = env.match(/VITE_SUPABASE_URL=(\S+)/)[1].trim()
const KEY = env.match(/VITE_SUPABASE_ANON_KEY=(\S+)/)[1].trim()

async function fetchArticles() {
  const res = await fetch(`${URL}/rest/v1/article?select=*`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  return (await res.json()).map((r) => ({
    id: r.id, code: r.code, name: r.name, ean: r.ean,
    l: Number(r.length_cm) / 100, w: Number(r.width_cm) / 100, h: Number(r.height_cm) / 100,
    weight: Number(r.weight_kg), canLie: r.can_lie,
  }))
}

// ── mjere ──────────────────────────────────────────────────────────────────

// Pokrivenost poda + NAJVEĆI mrtvi džep (pravokutnik praznog poda).
// Zašto: postotak popunjenosti sam po sebi laže — 70% može biti uredno složeno ili
// „svugdje po malo rupa". Veliki prazan pravokutnik na podu = konkretno propušten prostor.
function floorMetrics(placed, van, cell = 0.05) {
  const nx = Math.ceil(van.L / cell), nz = Math.ceil(van.W / cell)
  const grid = Array.from({ length: nz }, () => new Uint8Array(nx))
  for (const p of placed) {
    if (p.y > 0.02) continue                                  // samo ono što stoji na podu
    for (let zi = Math.floor(p.z / cell); zi < Math.ceil((p.z + p.dz) / cell) && zi < nz; zi++)
      for (let xi = Math.floor(p.x / cell); xi < Math.ceil((p.x + p.dx) / cell) && xi < nx; xi++)
        if (zi >= 0 && xi >= 0) grid[zi][xi] = 1
  }
  let covered = 0
  for (const row of grid) for (const v of row) covered += v
  const total = nx * nz

  // Najveći prazan pravokutnik (histogram po redovima) — klasičan pristup.
  const h = new Int32Array(nx)
  let bestArea = 0, bestDims = [0, 0]
  for (let zi = 0; zi < nz; zi++) {
    for (let xi = 0; xi < nx; xi++) h[xi] = grid[zi][xi] ? 0 : h[xi] + 1
    const st = []
    for (let xi = 0; xi <= nx; xi++) {
      const cur = xi === nx ? 0 : h[xi]
      while (st.length && h[st[st.length - 1]] >= cur) {
        const height = h[st.pop()]
        const left = st.length ? st[st.length - 1] + 1 : 0
        const width = xi - left
        if (height * width > bestArea) { bestArea = height * width; bestDims = [width * cell, height * cell] }
      }
      st.push(xi)
    }
  }
  return {
    coveragePct: (covered / total) * 100,
    deadRect: { area: bestArea * cell * cell, l: bestDims[0], w: bestDims[1] },
  }
}

// Tvrda pravila — ista provjera kao packer-bench (posuđeno, skraćeno).
function validate(placed, van) {
  const errs = []
  const ov = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > EPS
  for (const p of placed) {
    if (p.x < -EPS || p.y < -EPS || p.z < -EPS ||
        p.x + p.dx > van.L + EPS || p.y + p.dy > van.H + EPS || p.z + p.dz > van.W + EPS)
      errs.push('izvan granica: ' + p.name)
  }
  for (let i = 0; i < placed.length; i++)
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i], b = placed[j]
      if (ov(a.x, a.x + a.dx, b.x, b.x + b.dx) && ov(a.y, a.y + a.dy, b.y, b.y + b.dy) && ov(a.z, a.z + a.dz, b.z, b.z + b.dz))
        errs.push('preklapanje')
    }
  return errs
}

// ── scenariji: otpremnice → kupci (akumulacija po nazivu kupca, kao u appu) ──
async function loadCustomers(files, products) {
  const byName = new Map()
  for (const f of files) {
    const buf = fs.readFileSync(`${ROOT}/${f}`)
    const parsed = parseOtpremnica(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
    const m = matchToCatalog(parsed, products)
    for (const c of m.customers) {
      if (!byName.has(c.name)) byName.set(c.name, { name: c.name, qty: {}, unmatched: 0 })
      const dst = byName.get(c.name)
      for (const it of c.items) {
        if (!it.article) { dst.unmatched += 1; continue }
        dst.qty[it.article.id] = (dst.qty[it.article.id] || 0) + (it.qty || 0)
      }
    }
  }
  return [...byName.values()].map((c, i) => ({ ...c, color: PALETTE[i % PALETTE.length] }))
}

function report(tag, custs, van, products) {
  const t0 = performance.now()
  const best = computeBest(custs, van, products)
  const ms = performance.now() - t0

  const vanVol = van.L * van.W * van.H
  const usedVol = best.placed.reduce((s, p) => s + p.dx * p.dy * p.dz, 0)
  const volPct = (usedVol / vanVol) * 100
  const kgPct = (best.weight / van.payload) * 100
  const fm = floorMetrics(best.placed, van)
  const errs = validate(best.placed, van)
  const totalItems = best.placed.length + best.unplaced.length

  // ŠTO je stvarno ograničilo utovar — najvažniji redak cijelog mjerila.
  //
  // Bez ovoga se brojke krivo čitaju: „59% popunjeno, 8 komada nije stalo" zvuči kao loš motor,
  // a može biti savršen motor na TEŽINSKOJ granici (kombi pun kilaže, ne prostora). U tom
  // slučaju bolji packer ne bi utovario ništa više i cijela zamjena motora ne bi ništa donijela.
  const remainKg = van.payload - best.weight
  const unplacedKg = best.unplaced.map((u) => u.weight)
  const lightestOut = unplacedKg.length ? Math.min(...unplacedKg) : 0

  // Teoretske gornje granice — što je uopće MOGUĆE, neovisno o motoru.
  const allItems = [...best.placed.map((p) => ({ weight: p.weight, vol: p.dx * p.dy * p.dz })),
                    ...best.unplaced.map((u) => ({ weight: u.weight, vol: u.l * u.w * u.h }))]
  const totalKg = allItems.reduce((s, x) => s + x.weight, 0)
  const totalVol = allItems.reduce((s, x) => s + x.vol, 0)
  const kgBound = totalKg > van.payload            // ni teoretski sve ne može po težini
  const volBound = totalVol > vanVol               // ni teoretski sve ne može po prostoru

  let limit
  if (best.unplaced.length === 0) limit = 'ništa (sve stalo)'
  else if (lightestOut > remainKg) limit = `TEŽINA — ni najlakši višak (${lightestOut.toFixed(0)} kg) ne stane u ${remainKg.toFixed(0)} kg`
  else limit = `PROSTOR — najlakši višak (${lightestOut.toFixed(0)} kg) BI stao po težini (${remainKg.toFixed(0)} kg slobodno) → geometrija ga odbija`

  console.log(`\n== ${tag} ==`)
  console.log(`  kupaca=${custs.length}  stavki=${totalItems}  utovareno=${best.placed.length}  neutovareno=${best.unplaced.length}`)
  console.log(`  popunjenost=${volPct.toFixed(1)}%   masa=${Math.round(best.weight)}/${van.payload} kg (${kgPct.toFixed(0)}%)`)
  console.log(`  pod pokriven=${fm.coveragePct.toFixed(1)}%   najveći mrtvi džep=${fm.deadRect.area.toFixed(2)} m² (${fm.deadRect.l.toFixed(2)}×${fm.deadRect.w.toFixed(2)} m)`)
  console.log(`  LIFO pomicanja pri istovaru=${best.up.moves}`)
  console.log(`  teoretski maksimum: sve stavke = ${(totalVol / vanVol * 100).toFixed(0)}% prostora, ${(totalKg / van.payload * 100).toFixed(0)}% nosivosti` +
              `${kgBound ? '  → SVE NE MOŽE STATI (težina)' : volBound ? '  → SVE NE MOŽE STATI (prostor)' : '  → sve BI teoretski moglo stati'}`)
  console.log(`  ograničenje: ${limit}`)
  console.log(`  valjanost=${errs.length ? 'GREŠKE → ' + errs.slice(0, 3).join(' | ') : 'OK'}   (${ms.toFixed(0)} ms)`)
  return {
    tag, volPct, kgPct, moves: best.up.moves, dead: fm.deadRect.area, errs: errs.length, ms,
    unplaced: best.unplaced.length,
    // „propušteno": koliko bi se komada JOŠ moglo dodati unutar preostale nosivosti.
    // Pohlepno od najlakšeg — jer se ne mogu dodati svi (zbroj bi probio nosivost).
    // Prva verzija je brojala svaki komad koji pojedinačno stane → grubo precjenjivala.
    // Ovo je jedina brojka koja mjeri KVALITETU motora; ostale mjere veličinu narudžbe.
    missed: (() => {
      let left = remainKg, k = 0
      for (const w of unplacedKg.slice().sort((a, b) => a - b)) { if (w > left) break; left -= w; k++ }
      return k
    })(),
    kgBound, volBound,
  }
}

// ── glavni tok ─────────────────────────────────────────────────────────────
const products = await fetchArticles()
const byId = Object.fromEntries(products.map((p) => [p.id, p]))
const VAN = { name: 'Kombi', L: 4.0, W: 2.0, H: 2.3, payload: 1400 }

console.log(`katalog: ${products.length} artikala · kombi ${VAN.L}×${VAN.W}×${VAN.H} m, ${VAN.payload} kg`)

const SCEN = [
  ['1 kupac (Frigo)',                    ['Otpremnica-Frigo.xls']],
  ['1 kupac (DomPlus)',                  ['Otpremnica-DomPlus.xls']],
  ['1 kupac, 2 otpremnice (Split 1+2)',  ['Otpremnica-Split-1.xls', 'Otpremnica-Split-2.xls']],
  ['2 kupca (Split + Marić)',            ['Otpremnica-Split-1.xls', 'Otpremnica-Maric.xls']],
  ['3 kupca (Split + Marić + Frigo)',    ['Otpremnica-Split-1.xls', 'Otpremnica-Maric.xls', 'Otpremnica-Frigo.xls']],
  ['4 kupca (sve otpremnice)',           ['Otpremnica-Split-1.xls', 'Otpremnica-Split-2.xls', 'Otpremnica-Maric.xls', 'Otpremnica-DomPlus.xls', 'Otpremnica-Frigo.xls']],
]

const rows = []
for (const [tag, files] of SCEN) {
  const custs = await loadCustomers(files, products)
  const unmatched = custs.reduce((s, c) => s + c.unmatched, 0)
  if (unmatched) console.log(`\n  ⚠ ${tag}: ${unmatched} stavki bez para u katalogu (ne ulaze u mjerenje)`)
  rows.push(report(tag, custs, VAN, byId))
}

console.log('\n────────────── SAŽETAK ──────────────')
console.log('scenarij                              popunj.  masa%  pomic.  neutov.  PROPUŠTENO')
for (const r of rows) {
  console.log(
    `${r.tag.padEnd(36)} ${r.volPct.toFixed(1).padStart(6)}  ${r.kgPct.toFixed(0).padStart(5)}  ` +
    `${String(r.moves).padStart(6)}  ${String(r.unplaced).padStart(7)}  ${String(r.missed).padStart(10)}`,
  )
}
const bad = rows.filter((r) => r.errs).length
const missedTotal = rows.reduce((s, r) => s + r.missed, 0)
console.log(bad ? `\n⚠ ${bad} scenarij(a) s NEVALJANIM rasporedom.` : '\nSvi rasporedi valjani.')
console.log(
  `\nPROPUŠTENO = komadi koje je motor izostavio iako bi po TEŽINI stali → jedina mjera kvalitete motora.\n` +
  `Ukupno propušteno: ${missedTotal}. ` +
  (missedTotal === 0
    ? 'Motor NIJE usko grlo u ovim scenarijima — granica je težina/veličina narudžbe.'
    : 'Ovoliko bi bolji motor mogao dodatno utovariti (gornja granica, ne jamstvo).'),
)
