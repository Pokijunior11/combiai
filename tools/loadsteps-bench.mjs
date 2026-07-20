// Provjera redoslijeda utovara. Pokreni: node tools/loadsteps-bench.mjs
// Pravilo (issue.txt): kabina → vrata, pod → strop — ALI nikad kutija prije svog oslonca.
import { computeBest } from '../app/src/lib/packer.js'
import { orderForLoading, buildLoadSteps, stepView } from '../app/src/lib/loadSteps.js'
import { VAN, PRODUCTS } from '../app/src/data/catalog.js'

const COLORS = ['#e0783f', '#2f7dd1', '#4fa06a']
const cust = (qty) => qty.map((q, i) => ({ name: `Kupac ${i + 1}`, color: COLORS[i], qty: q }))
const EPS = 1e-6
const ov = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0) > EPS
const supports = (A, B) =>
  Math.abs(A.y + A.dy - B.y) <= 1e-3 &&
  ov(A.x, A.x + A.dx, B.x, B.x + B.dx) &&
  ov(A.z, A.z + A.dz, B.z, B.dz + B.z)

// Sve količine na prva 3 artikla iz kataloga — dovoljno za stogove.
const keys = Object.keys(PRODUCTS)
const scenarios = [
  { title: 'A — jedan kupac, pun kombi', custs: cust([{ [keys[0]]: 6, [keys[1]]: 6, [keys[2]]: 4 }]) },
  { title: 'B — dva kupca (LIFO)', custs: cust([{ [keys[0]]: 4, [keys[1]]: 3 }, { [keys[1]]: 4, [keys[2]]: 3 }]) },
  { title: 'C — tri kupca', custs: cust([{ [keys[0]]: 3 }, { [keys[1]]: 3, [keys[2]]: 2 }, { [keys[0]]: 3, [keys[2]]: 2 }]) },
]

let fail = 0
for (const s of scenarios) {
  const best = computeBest(s.custs, VAN, PRODUCTS)
  const ordered = orderForLoading(best.placed)
  const errs = []

  // 1) svaki oslonac mora doći PRIJE kutije koja na njemu stoji
  const posOf = new Map(ordered.map((b, i) => [b._id, i]))
  for (const B of ordered) {
    for (const A of ordered) {
      if (A !== B && supports(A, B) && posOf.get(A._id) > posOf.get(B._id)) {
        errs.push(`"${B.name}" (korak ${posOf.get(B._id) + 1}) dolazi PRIJE svog oslonca "${A.name}" (korak ${posOf.get(A._id) + 1})`)
      }
    }
  }
  // 2) svaka kutija točno jednom
  if (ordered.length !== best.placed.length) errs.push(`broj koraka ${ordered.length} ≠ utovareno ${best.placed.length}`)

  // 3) upute se izgrade bez pucanja i imaju mjesto
  const steps = buildLoadSteps(best.placed, VAN)
  if (steps.some((x) => !x.spot || typeof x.spot.fromCabin !== 'number')) errs.push('nepotpun opis mjesta')

  const onFloorFirst = ordered.findIndex((b) => b.y > 0.02)
  console.log(`\n${s.title}: ${best.placed.length} kom, ${ordered.length} koraka`)
  console.log(`  prvih ${onFloorFirst < 0 ? ordered.length : onFloorFirst} koraka je na podu`)
  console.log('  primjer koraka 1-3:')
  for (const st of steps.slice(0, 3)) {
    console.log(`   ${st.n}. ${st.name} · ${st.spot.layer} · ${st.spot.side} · ${st.spot.fromCabin.toFixed(2)} m od kabine`)
  }
  if (errs.length) { fail++; console.log('  ❌ ' + errs.join('\n  ❌ ')) }
  else console.log('  ✅ redoslijed valjan (nijedna kutija prije svog oslonca)')
}

// ── Način „korak po korak": stepView (žive brojke, 3 stanja, rubovi 0 i n) ──
console.log('\n=== stepView (kriška B) ===')
{
  const best = computeBest(cust([{ [keys[0]]: 4, [keys[1]]: 4 }]), VAN, PRODUCTS)
  const steps = buildLoadSteps(best.placed, VAN)
  const n = steps.length
  const errs = []

  // Početak: ništa utovareno, prvi je „current", nema „done" kutija.
  const v0 = stepView(steps, 0, VAN)
  if (v0.stats.loaded !== 0) errs.push(`korak 0: utovareno ${v0.stats.loaded}, očekivano 0`)
  if (v0.stats.kg !== 0) errs.push(`korak 0: težina ${v0.stats.kg}, očekivano 0`)
  if (v0.done) errs.push('korak 0 ne smije biti "gotovo"')
  if (v0.boxes.some((b) => b._vis === 'done')) errs.push('korak 0: ništa ne smije biti "utovareno"')
  if (v0.boxes.filter((b) => b._vis === 'current').length !== 1) errs.push('korak 0: mora biti točno 1 "current"')

  // Kraj: sve utovareno, nema "current", težina = ukupna.
  const vn = stepView(steps, n, VAN)
  const totalKg = steps.reduce((s, x) => s + x.weight, 0)
  if (!vn.done) errs.push(`korak ${n} mora biti "gotovo"`)
  if (vn.cur) errs.push('na kraju ne smije biti trenutnog artikla')
  if (Math.abs(vn.stats.kg - totalKg) > 1e-6) errs.push(`kraj: težina ${vn.stats.kg} ≠ ukupna ${totalKg}`)
  if (vn.stats.loaded !== n) errs.push(`kraj: utovareno ${vn.stats.loaded} ≠ ${n}`)

  // Monotonost: brojke smiju samo rasti kako se ide naprijed.
  let prevKg = -1, prevVol = -1
  for (let i = 0; i <= n; i++) {
    const v = stepView(steps, i, VAN)
    if (v.stats.kg < prevKg - 1e-9) errs.push(`težina pala na koraku ${i}`)
    if (v.stats.volPct < prevVol - 1e-9) errs.push(`prostor pao na koraku ${i}`)
    prevKg = v.stats.kg; prevVol = v.stats.volPct
    if (!v.done && v.boxes.filter((b) => b._vis === 'current').length !== 1) errs.push(`korak ${i}: nije točno 1 "current"`)
    if (v.boxes.filter((b) => b._vis === 'next').length > 1) errs.push(`korak ${i}: više od 1 "sljedeći"`)
  }

  // Klamp: izvan dosega se ne smije srušiti (plan se mogao promijeniti pod nogama).
  if (stepView(steps, -5, VAN).at !== 0) errs.push('negativan korak se ne klampa na 0')
  if (stepView(steps, n + 99, VAN).at !== n) errs.push(`prevelik korak se ne klampa na ${n}`)

  // Zadnji korak nema „sljedeći".
  if (stepView(steps, n - 1, VAN).next) errs.push('zadnji korak ne smije imati "sljedeći"')

  console.log(`  ${n} koraka · ukupno ${totalKg.toFixed(0)} kg`)
  console.log(`  korak 0: ${v0.stats.loaded}/${n}, ${v0.stats.kg.toFixed(0)} kg · korak ${n}: ${vn.stats.loaded}/${n}, ${vn.stats.kg.toFixed(0)} kg`)
  if (errs.length) { fail++; console.log('  ❌ ' + errs.join('\n  ❌ ')) }
  else console.log('  ✅ brojke, stanja i rubni koraci ispravni')
}

console.log(fail ? `\n${fail} scenarij(a) palo.` : '\nSve prošlo.')
process.exit(fail ? 1 : 0)
