// Redoslijed utovara + opis mjesta za skladištara.
//
// Pravilo (issue.txt): „po redu od kabine do vrata, ali odozdo prema gore (s poda prema vrhu)".
// Ali to nije puki sort — kutija se NE MOŽE utovariti prije one na kojoj stoji. Zato:
//   1) tvrdo ograničenje: svi OSLONCI moraju biti utovareni prije kutije koja na njima stoji,
//   2) među onima koje su „na redu" biramo: bliže kabini (manji x) → niže (manji y) → z.
// Greedy s tim prioritetom daje kabina→vrata i pod→strop, a nikad ne traži nemoguć potez.
//
// Osi: x = duljina (0 = kabina, raste prema vratima), y = visina (0 = pod), z = širina.

import { labelOf } from './labels.js'

const EPS = 1e-6

// Preklapaju li se dva raspona (strogo, dodir se ne broji).
function overlaps(a0, a1, b0, b1) {
  return Math.min(a1, b1) - Math.max(a0, b0) > EPS
}

// A drži B: gornja ploha A-a je na dnu B-a i tlocrti se preklapaju.
function supports(A, B) {
  if (Math.abs(A.y + A.dy - B.y) > 1e-3) return false
  return overlaps(A.x, A.x + A.dx, B.x, B.x + B.dx) &&
         overlaps(A.z, A.z + A.dz, B.z, B.z + B.dz)
}

// Topološki redoslijed utovara. Vraća polje kutija (iste reference, + redni broj).
export function orderForLoading(placed) {
  const boxes = placed.map((p, i) => ({ ...p, _id: i }))
  const deps = new Map()            // _id → Set(_id oslonaca)
  for (const B of boxes) {
    const s = new Set()
    for (const A of boxes) if (A !== B && supports(A, B)) s.add(A._id)
    deps.set(B._id, s)
  }

  const loaded = new Set()
  const out = []
  const left = new Set(boxes.map((b) => b._id))
  const byId = new Map(boxes.map((b) => [b._id, b]))

  while (left.size) {
    // spremne = one kojima su svi oslonci već utovareni
    let ready = [...left].filter((id) => [...deps.get(id)].every((d) => loaded.has(d)))
    // Sigurnosna mreža: kod (teoretski) kružnog oslanjanja ne blokiraj — uzmi sve preostale.
    if (!ready.length) ready = [...left]
    ready.sort((ia, ib) => {
      const a = byId.get(ia), b = byId.get(ib)
      return a.x - b.x || a.y - b.y || a.z - b.z
    })
    const pick = ready[0]
    loaded.add(pick); left.delete(pick)
    out.push(byId.get(pick))
  }
  return out.map((b, i) => ({ ...b, step: i }))
}

// Stanje zaslona za korak `i` (0..n). `i === n` = utovar gotov.
// Čista funkcija (bez Reacta) namjerno — ovdje su off-by-one greške koje se okom ne vide,
// pa se testira u `tools/loadsteps-bench.mjs`.
//
// Dogovor: na koraku `i` komadi 0..i-1 su VEĆ utovareni, `i` je onaj koji se SAD nosi.
// Zato brojke prikazuju `slice(0, i)` — ne uključuju trenutni (još nije unutra).
export function stepView(steps, i, van) {
  const n = steps.length
  const at = Math.max(0, Math.min(n, i))
  const done = at >= n
  const loaded = steps.slice(0, at)
  const kg = loaded.reduce((s, x) => s + x.weight, 0)
  const vol = loaded.reduce((s, x) => s + x.dims.dx * x.dims.dy * x.dims.dz, 0)

  return {
    at,
    done,
    cur: done ? null : steps[at],
    next: at + 1 < n ? steps[at + 1] : null,
    stats: {
      loaded: at,
      total: n,
      kg,
      kgPct: van.payload ? Math.min(100, (kg / van.payload) * 100) : 0,
      volPct: (vol / (van.L * van.W * van.H)) * 100,
    },
    // Kutije za 3D: prije trenutnog = blijedo, trenutni = jarko, sljedeći = obris, ostalo se ne crta.
    boxes: steps
      .map((s, idx) => ({ ...s.box, _vis: idx < at ? 'done' : idx === at ? 'current' : idx === at + 1 ? 'next' : null }))
      .filter((b) => b._vis !== null),
  }
}

// Na čemu kutija stoji (nazivi) — za uputu „stavi na vrh: …".
function restsOn(box, all) {
  return all.filter((A) => A !== box && supports(A, box)).map((A) => labelOf(A, A.name))
}

// Ljudski opis mjesta u kombiju.
//
// LIJEVO/DESNO — izvedeno iz geometrije, ne pogađano (bilo je NAOPAKO do 2026-07-20):
// kabina je na −X, vrata na +X, dakle kombi vozi prema −X. I vozač (sjedi okrenut naprijed)
// i skladištar (stoji na vratima i gleda unutra) gledaju u ISTI smjer (−X), pa im se lijevo/desno
// poklapa. Za pogled u −X uz „gore" = +Y ispada desno = −Z. Dakle:
//   MALI z = DESNO (suvozačeva strana) · VELIKI z = LIJEVO (vozačeva strana).
function describeSpot(box, van, all) {
  const zc = box.z + box.dz / 2
  const side = zc < van.W / 3 ? 'desno' : zc > (2 * van.W) / 3 ? 'lijevo' : 'sredina'
  const onFloor = box.y < 0.02
  const under = onFloor ? [] : restsOn(box, all)
  const xc = box.x + box.dx / 2
  const depth = xc < van.L / 3 ? 'uz kabinu' : xc > (2 * van.L) / 3 ? 'do vrata' : 'sredina kombija'
  return {
    side,
    depth,
    onFloor,
    under,
    fromCabin: box.x,                     // m od kabine do bližeg ruba
    height: box.y,                        // m od poda do dna kutije
    // Krupna uputa na kartici, npr. „DESNO DOLJE" / „LIJEVO GORE".
    headline: `${side.toUpperCase()}${side === 'sredina' ? '' : onFloor ? ' DOLJE' : ' GORE'}`,
    layer: onFloor ? 'na pod' : under.length ? `na vrh: ${under.join(', ')}` : `u vis (${box.y.toFixed(2)} m)`,
  }
}

// Glavni ulaz: gotove upute korak-po-korak.
// Uz tekst nosi i `box` (geometrija) — da kartica i 3D crtaju ISTI komad i ne mogu se raspametiti.
export function buildLoadSteps(placed, van) {
  const ordered = orderForLoading(placed)
  return ordered.map((b, i) => ({
    n: i + 1,
    box: b,
    name: labelOf(b, b.name),             // kratko („Heinner {code}"), ne marketinški opis
    code: b.code || null,
    ean: b.ean || null,
    custName: b.custName,
    color: b.color,
    weight: b.weight,
    dims: { dx: b.dx, dy: b.dy, dz: b.dz },
    spot: describeSpot(b, van, ordered),
  }))
}
