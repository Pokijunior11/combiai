// Test sloja „mora u kombi" (DIO 2). Pokreni: node tools/mustfit-bench.mjs
// Provjerava: (A) kad sve stane — 0 izbacivanja; (B) kad ne stane — izbaci NEOBAVEZNO
// dok obavezno stane; (C) kad ni obavezno ne stane — iskreno javi.
import { computeWithMust } from '../app/src/lib/mustFit.js'
import { VAN, PRODUCTS } from '../app/src/data/catalog.js'

let fails = 0
const check = (cond, msg) => { console.log(`  ${cond ? 'OK ' : 'FAIL'}  ${msg}`); if (!cond) fails++ }

function placedCount(best, ci, artId) {
  return best.placed.filter((p) => p.custIdx === ci && p.key === artId).length
}

// Kupac s qty + must (must[art] = koliko MORA stati).
const C = (qty, must) => [{ name: 'Kupac 1', color: '#e0783f', qty, must: must || {} }]

// ---- A: sve stane → nema izbacivanja, sve obavezno stane ----
{
  console.log('\n== A  K1{hladnjak:5 (svih 5 mora)} — stane, bez izbacivanja ==')
  const best = computeWithMust(C({ hladnjak: 5 }, { hladnjak: 5 }), VAN, PRODUCTS)
  check(best.mustFits, 'mustFits = true')
  check(best.dropped.length === 0, 'ništa nije izbačeno')
  check(placedCount(best, 0, 'hladnjak') === 5, '5 hladnjaka složeno')
}

// ---- B: 20 perilica MORAJU (točno 1400kg → sâme stanu), a dodano je 10 NEOBAVEZNIH hladnjaka
// koji ih istiskuju (s njima packer složi samo 11 perilica). Sloj mora izbaciti hladnjake dok
// svih 20 perilica ne stane. ----
{
  console.log('\n== B  K1{perilica:20 (mora 20), hladnjak:10 (neobavezno)} — izbaci hladnjake da perilice stanu ==')
  const best = computeWithMust(C({ perilica: 20, hladnjak: 10 }, { perilica: 20 }), VAN, PRODUCTS)
  check(best.mustFits, 'mustFits = true (svih 20 obaveznih stane)')
  check(placedCount(best, 0, 'perilica') === 20, '20 perilica složeno')
  check(best.dropped.length > 0 && best.dropped.every((d) => d.artId === 'hladnjak'), 'izbačeni SAMO hladnjaci (neobavezno)')
  const drop = best.dropped.reduce((n, d) => n + d.count, 0)
  console.log(`     izbačeno neobavezno: ${best.dropped.map((d) => `${d.name}×${d.count}`).join(', ')} (ukupno ${drop})`)
  check(best.weight <= VAN.payload + 1e-6, `težina ${Math.round(best.weight)}kg ≤ nosivost ${VAN.payload}kg`)
}

// ---- C: ni sama obavezna ne stanu (30 hladnjaka × 60kg = 1800kg > 1400) → iskreno „ne stane" ----
{
  console.log('\n== C  K1{hladnjak:30 (svih 30 mora)} — ni obavezno ne stane ==')
  const best = computeWithMust(C({ hladnjak: 30 }, { hladnjak: 30 }), VAN, PRODUCTS)
  check(!best.mustFits, 'mustFits = false')
  check(best.mustShort > 0, `mustShort > 0 (ne stane ${best.mustShort} obaveznih)`)
  check(best.dropped.length === 0, 'nema neobaveznog za izbaciti (sve je bilo obavezno)')
}

// ---- D: bez ijednog „mora" → ponaša se kao čisti computeBest (0 izbacivanja) ----
{
  console.log('\n== D  K1{hladnjak:3} bez „mora" — kao obični packer ==')
  const best = computeWithMust(C({ hladnjak: 3 }, {}), VAN, PRODUCTS)
  check(best.mustFits, 'mustFits = true (nema obaveznih)')
  check(best.dropped.length === 0, 'ništa nije izbačeno')
}

console.log(`\n${fails ? `✗ ${fails} FAIL` : '✓ svi testovi prošli'}`)
process.exit(fails ? 1 : 0)
