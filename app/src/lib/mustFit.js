// Sloj ODABIRA iznad packera (DIO 2 „mora u kombi"). Packer ostaje CRNA KUTIJA —
// heuristike slaganja se NE diraju (v. PLAN §0). Ovdje samo biramo ŠTO ulazi u packer:
//
//   1. Pusti sve (obavezno + neobavezno) kroz computeBest.
//   2. Ako sva OBAVEZNA (must_qty) stanu → gotovo (višak neobaveznog = „nije stalo").
//   3. Ako neko OBAVEZNO ne stane → izbaci najmanje bitan NEOBAVEZAN komad i ponovo
//      složi (packer sam presloži), dok sva obavezna ne stanu — ili dok ne ponestane
//      neobaveznog (tad ni obavezno ne stane → iskreno javi).
//
// „Najmanje bitan neobavezan": među neobaveznima nema ranga → mičemo NAJVEĆE prvo
// (najviše oslobodi prostor/težinu → najmanje ukupno izbačenih komada, najviše ostane).
import { computeBest } from './packer.js'

const labelOf = (p) => (p ? (p.code ? `Heinner ${p.code}` : p.name) : '?')

// Koliko komada svakog (kupac, artikl) je packer STVARNO složio.
function placedCounts(result) {
  const m = {}
  for (const p of result.placed) {
    const k = p.custIdx + '|' + p.key
    m[k] = (m[k] || 0) + 1
  }
  return m
}

// Koliko OBAVEZNIH komada (po originalnim must) i dalje NE stane u dani raspored.
function mustShortfall(result, customers) {
  const counts = placedCounts(result)
  let short = 0
  customers.forEach((c, ci) => {
    for (const [artId, m] of Object.entries(c.must || {})) {
      if (m <= 0) continue
      const placed = counts[ci + '|' + artId] || 0
      if (placed < m) short += m - placed
    }
  })
  return short
}

// Svi NEOBAVEZNI komadi (qty − must) kao pojedinačne jedinice, sortirani NAJVEĆI prvo
// (volumen, pa težina) — mičemo ih tim redom da obavezno stane uz najmanje izbacivanja.
function optionalPool(customers, products) {
  const pool = []
  customers.forEach((c, ci) => {
    for (const [artId, qty] of Object.entries(c.qty || {})) {
      const p = products[artId]
      if (!p) continue
      const must = Math.min(c.must?.[artId] || 0, qty)
      const opt = qty - must
      const vol = p.l * p.w * p.h
      for (let i = 0; i < opt; i++) pool.push({ custIdx: ci, artId, vol, weight: p.weight })
    }
  })
  pool.sort((a, b) => b.vol - a.vol || b.weight - a.weight)
  return pool
}

// Glavni ulaz umjesto computeBest kad stavke nose „mora". Isti oblik rezultata +:
//   mustFits  — stanu li sva obavezna,
//   mustShort — koliko obaveznih komada i dalje ne stane (kad ni sama obavezna ne stanu),
//   dropped   — [{ custIdx, artId, name, count }] neobavezni izbačeni da obavezno stane.
export function computeWithMust(customers, van, products) {
  // radna kopija: mijenja se samo qty (mičemo neobavezno); must ostaje netaknut
  const work = customers.map((c) => ({ ...c, qty: { ...(c.qty || {}) }, must: { ...(c.must || {}) } }))
  const pool = optionalPool(customers, products) // najveći neobavezni prvi
  let ptr = 0
  const droppedPieces = []

  let best = computeBest(work, van, products)
  while (mustShortfall(best, customers) > 0 && ptr < pool.length) {
    const d = pool[ptr++]
    work[d.custIdx].qty[d.artId] -= 1
    if (work[d.custIdx].qty[d.artId] <= 0) delete work[d.custIdx].qty[d.artId]
    droppedPieces.push(d)
    best = computeBest(work, van, products)
  }

  // agregiraj izbačeno po (kupac, artikl) za prikaz
  const agg = {}
  for (const d of droppedPieces) {
    const k = d.custIdx + '|' + d.artId
    if (!agg[k]) agg[k] = { custIdx: d.custIdx, artId: d.artId, name: labelOf(products[d.artId]), count: 0 }
    agg[k].count++
  }

  const shortfall = mustShortfall(best, customers)
  return { ...best, dropped: Object.values(agg), mustFits: shortfall === 0, mustShort: shortfall }
}
