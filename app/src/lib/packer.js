// Čista logika slaganja (bin packing) — bez DOM/Three ovisnosti, testabilna u Node-u.
// Koordinate: x = duljina (0 = kabina, van.L = vrata), y = visina, z = širina.
// Tvrda pravila: stane (AABB), ne preklapa, pun oslonac, masa_gore <= masa_dolje, nosivost.
// Ciljevi (meko): (1) max utovareno, (2) min pomicanja pri istovaru.

const EPS = 1e-6

export function orientations(it) {
  const perms = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]
  const d = [it.l, it.w, it.h]
  const seen = new Set(), out = []
  for (const [a,b,c] of perms) {
    const o = { dx: d[a], dy: d[b], dz: d[c] }
    if (!it.canLie && Math.abs(o.dy - it.h) > EPS) continue // uspravno -> visina = h
    const k = o.dx.toFixed(3)+','+o.dy.toFixed(3)+','+o.dz.toFixed(3)
    if (seen.has(k)) continue
    seen.add(k); out.push(o)
  }
  return out
}

function fitsBounds(c, van) {
  return c.x >= -EPS && c.y >= -EPS && c.z >= -EPS &&
         c.x + c.dx <= van.L + EPS && c.y + c.dy <= van.H + EPS && c.z + c.dz <= van.W + EPS
}
function overlap(a, b) {
  return a.x < b.x+b.dx-EPS && b.x < a.x+a.dx-EPS &&
         a.y < b.y+b.dy-EPS && b.y < a.y+a.dy-EPS &&
         a.z < b.z+b.dz-EPS && b.z < a.z+a.dz-EPS
}
function collides(c, placed) { return placed.some(p => overlap(c, p)) }

function unionArea(rects) {
  const xs = [...new Set(rects.flatMap(r => [r.x0, r.x1]))].sort((a,b)=>a-b)
  const zs = [...new Set(rects.flatMap(r => [r.z0, r.z1]))].sort((a,b)=>a-b)
  let area = 0
  for (let i=0;i<xs.length-1;i++) for (let j=0;j<zs.length-1;j++) {
    const cx=(xs[i]+xs[i+1])/2, cz=(zs[j]+zs[j+1])/2
    if (rects.some(r=>cx>r.x0&&cx<r.x1&&cz>r.z0&&cz<r.z1)) area += (xs[i+1]-xs[i])*(zs[j+1]-zs[j])
  }
  return area
}
function supported(c, placed) {
  if (c.y <= EPS) return true // pod
  const rects = []
  for (const p of placed) {
    if (Math.abs(p.y + p.dy - c.y) < 1e-4) {
      const x0=Math.max(p.x,c.x), x1=Math.min(p.x+p.dx, c.x+c.dx)
      const z0=Math.max(p.z,c.z), z1=Math.min(p.z+p.dz, c.z+c.dz)
      if (x1-x0>EPS && z1-z0>EPS) {
        if (c.weight > p.weight + 1e-6) return false // teže na lakše -> zabranjeno
        rects.push({ x0, x1, z0, z1 })
      }
    }
  }
  if (!rects.length) return false
  return unionArea(rects) >= c.dx*c.dz - 1e-3 // pun oslonac
}
// Koliko bi KASNIJIH kupaca (index > ci, istovaruju se prije) kutija c blokirala — front (ispred
// prema vratima) ili above (iznad). Točno onako kako unloadPlan broji pomicanja. 0 = čist istovar.
function laterBlocked(c, ci, items) {
  const set = new Set()
  for (const B of items) {
    if (B.custIdx <= ci || set.has(B.custIdx)) continue
    const yOv = c.y < B.y + B.dy - EPS && B.y < c.y + c.dy - EPS
    const zOv = c.z < B.z + B.dz - EPS && B.z < c.z + c.dz - EPS
    const xOv = c.x < B.x + B.dx - EPS && B.x < c.x + c.dx - EPS
    const front = yOv && zOv && (c.x + c.dx > B.x + B.dx + EPS)
    const above = xOv && zOv && (c.y + c.dy > B.y + B.dy + EPS)
    if (front || above) set.add(B.custIdx)
  }
  return set.size
}
// TVRDI LIFO za strukturu (teško, ne može se odložiti): komad kupca ci NE SMIJE
//  (a) biti ZAROBLJEN iza RANIJEG kupca (index < ci; taj je pri istovaru ci još u kombiju i stoji
//      ISPRED prema vratima → ne dođe se do c), ni
//  (b) blokirati KASNIJEG kupca (index > ci; taj izlazi prije).
// Slaganje kasnijeg NA ranijeg (npr. K2 na K1, bok uz bok) je OK — skine se s vrha kad taj izlazi.
// IZNIMKA (topper preko granice): lagani komad ranijeg kupca SMIJE sjesti IZRAVNO NA teži komad
// kasnijeg kupca — pri istovaru kasnijeg se samo skine (=1 pomicanje), ne zarobljava ga trajno.
function structureBlocked(c, ci, items) {
  for (const B of items) {
    const zOv = c.z < B.z + B.dz - EPS && B.z < c.z + c.dz - EPS
    const yOv = c.y < B.y + B.dy - EPS && B.y < c.y + c.dy - EPS
    const xOv = c.x < B.x + B.dx - EPS && B.x < c.x + c.dx - EPS
    if (B.custIdx < ci) {
      // raniji kupac ISPRED (prema vratima) u istom y-z kanalu → c je zarobljen
      if (yOv && zOv && B.x + B.dx > c.x + c.dx + EPS) return true
    } else if (B.custIdx > ci) {
      const front = yOv && zOv && (c.x + c.dx > B.x + B.dx + EPS)
      const above = xOv && zOv && (c.y + c.dy > B.y + B.dy + EPS)
      // Dozvoljeni topper: c leži IZRAVNO na B i lakši je od B → skine se pri istovaru (1 pomicanje).
      const onTopOfB = above && Math.abs(c.y - (B.y + B.dy)) < 1e-4 && c.weight < B.weight - 1e-6
      if (front) return true // c ispred kasnijeg kupca → zarobio bi ga
      if (above && !onTopOfB) return true // c iznad kasnijeg (a nije dozvoljeni topper na njemu)
    }
  }
  return false
}
// Koliko je kutija c „ugniježđena" — broj bočnih strana (±x, ±z) prislonjenih uz drugu kutiju ili
// stijenku kombija. Više = stabilnije (u rupi/niši); 0 = izložena (npr. sama na vrhu frižidera → može
// skliznuti u vožnji). Koristi se da fileri (mikrovalne) sjednu u rupe, a ne da se penju izloženi.
function containment(c, items, van) {
  const yzHit = B => c.y < B.y + B.dy - EPS && B.y < c.y + c.dy - EPS && c.z < B.z + B.dz - EPS && B.z < c.z + c.dz - EPS
  const xyHit = B => c.x < B.x + B.dx - EPS && B.x < c.x + c.dx - EPS && c.y < B.y + B.dy - EPS && B.y < c.y + c.dy - EPS
  let n = 0
  if (c.x <= EPS || items.some(B => Math.abs(B.x + B.dx - c.x) < 1e-3 && yzHit(B))) n++
  if (c.x + c.dx >= van.L - EPS || items.some(B => Math.abs(B.x - (c.x + c.dx)) < 1e-3 && yzHit(B))) n++
  if (c.z <= EPS || items.some(B => Math.abs(B.z + B.dz - c.z) < 1e-3 && xyHit(B))) n++
  if (c.z + c.dz >= van.W - EPS || items.some(B => Math.abs(B.z - (c.z + c.dz)) < 1e-3 && xyHit(B))) n++
  return n
}
function insideAny(pt, placed) {
  return placed.some(p => pt.x>p.x+EPS && pt.x<p.x+p.dx-EPS &&
                          pt.y>p.y+EPS && pt.y<p.y+p.dy-EPS &&
                          pt.z>p.z+EPS && pt.z<p.z+p.dz-EPS)
}
function dedupePts(pts) {
  const seen = new Set()
  return pts.filter(p => { const k=p.x.toFixed(3)+','+p.y.toFixed(3)+','+p.z.toFixed(3); if (seen.has(k)) return false; seen.add(k); return true })
}
function lessKey(a, b) { for (let i=0;i<a.length;i++){ if(a[i]<b[i]-1e-9) return true; if(a[i]>b[i]+1e-9) return false } return false }

// --- Klasifikacija (samo za redoslijed slaganja, NIJE tvrdo pravilo) ---
// Filer = nisko/lagano (mikrovalna) → puni tavan iznad struktura. Struktura → zauzima pod.
// Prag po visini: sve strukturne bijele stvari su ≥ 0.82 m, mikrovalna 0.30 m.
const isFiller = it => it.h <= 0.5
const area = it => it.l * it.w

const vol = it => it.l * it.w * it.h

// Strategije za MAX-LOAD pretragu: probaju se različiti redoslijedi i ključevi slaganja strukture,
// pa se uzme najbolji VALJANI (LIFO) raspored. Model (tvrda pravila + LIFO) je fiksan; pretraga samo
// maksimizira punjenje — kao "check max load" alati. Time nema lažnog „ne stane" jer jedan red zapne.
const STRUCT_CMPS = [
  (a, b) => area(b) - area(a) || b.weight - a.weight || b.h - a.h, // najveća površina prvo
  (a, b) => b.h - a.h || area(b) - area(a) || b.weight - a.weight, // najviše prvo (gradi stupce)
  (a, b) => vol(b) - vol(a) || b.weight - a.weight,                // najveći volumen prvo
  (a, b) => b.weight - a.weight || area(b) - area(a),              // najteže prvo
]
const STRUCT_KEYS = [
  c => [c.x, c.y, c.z], // plitko → u vis → po širini (gradi stupce, čuva dužinu poda)
  c => [c.x, c.z, c.y], // plitko → po širini → u vis (puni presjek po podu pa se penje)
]

// Složi SVE stavke jednog kupca u pojas [frontier, van.L]: na pod ili na već složeno,
// ali nikad dublje od granice (strogi LIFO po dubini). Vrati nove komade + novu granicu.
function packCustomer(items, placed, totW0, frontier, van, structKey) {
  const mine = [], unplaced = []
  let totW = totW0
  let points = [{ x: frontier, y: 0, z: 0 }]
  for (const it of items) {
    let best = null
    for (const P of points) {
      if (P.x < frontier - EPS) continue // nikad iza granice (LIFO po dubini)
      for (const o of orientations(it)) {
        const c = { x: P.x, y: P.y, z: P.z, dx: o.dx, dy: o.dy, dz: o.dz, weight: it.weight }
        if (c.x < frontier - EPS) continue
        if (!fitsBounds(c, van)) continue
        if (totW + it.weight > van.payload + EPS) continue
        if (collides(c, placed) || collides(c, mine)) continue
        if (!supported(c, [...placed, ...mine])) continue
        if (structureBlocked(c, it.custIdx, [...placed, ...mine])) continue // tvrdi LIFO
        const k = structKey(c)
        if (!best || lessKey(k, best.k)) best = { c, k }
      }
    }
    if (!best) { unplaced.push(it); continue }
    const c = best.c
    mine.push({ ...it, x: c.x, y: c.y, z: c.z, dx: c.dx, dy: c.dy, dz: c.dz })
    totW += it.weight
    points.push({ x: c.x + c.dx, y: c.y, z: c.z })
    points.push({ x: c.x, y: c.y, z: c.z + c.dz })
    points.push({ x: c.x, y: c.y + c.dy, z: c.z })
    points = dedupePts(points.filter(pt => !insideAny(pt, [...placed, ...mine])))
  }
  const maxX = mine.reduce((m, p) => Math.max(m, p.x + p.dx), frontier)
  return { mine, unplaced, totW, maxX }
}

// Plan istovara: obrnuto od utovara (najveći custIdx prvi). Broji "pomakni X".
export function unloadPlan(placed) {
  const inVan = new Set(placed)
  const order = [...new Set(placed.map(p => p.custIdx))].sort((a,b)=>b-a)
  let moves = 0
  const steps = []
  for (const ci of order) {
    const mine = placed.filter(p => p.custIdx===ci && inVan.has(p))
    const blockers = new Set()
    for (const Y of mine) {
      for (const B of inVan) {
        if (B===Y || B.custIdx===ci) continue
        const yOv = Y.y < B.y+B.dy-EPS && B.y < Y.y+Y.dy-EPS
        const zOv = Y.z < B.z+B.dz-EPS && B.z < Y.z+Y.dz-EPS
        const xOv = Y.x < B.x+B.dx-EPS && B.x < Y.x+Y.dx-EPS
        const front = yOv && zOv && (B.x+B.dx > Y.x+Y.dx+EPS) // ispred prema vratima
        const above = xOv && zOv && (B.y+B.dy > Y.y+Y.dy+EPS) // na vrhu
        if (front || above) blockers.add(B)
      }
    }
    moves += blockers.size
    steps.push({
      custIdx: ci,
      name: mine[0] ? mine[0].custName : ('Kupac ' + (ci+1)),
      color: mine[0] ? mine[0].color : '#888',
      count: mine.length,
      blockers: [...blockers].map(b => ({ name: b.name, custName: b.custName })),
    })
    for (const Y of mine) inVan.delete(Y)
  }
  return { moves, steps }
}

// Stavke jednog kupca, razdvojene. Struktura se sortira zadanim redoslijedom (strategija).
function customerParts(cust, ci, products, structCmp) {
  const struct = [], fill = []
  for (const k of Object.keys(products)) {
    const n = (cust.qty && cust.qty[k]) || 0
    for (let i = 0; i < n; i++) {
      const p = products[k]
      const it = { ...p, key: k, custName: cust.name, custIdx: ci, color: cust.color }
      ;(isFiller(it) ? fill : struct).push(it)
    }
  }
  struct.sort(structCmp)
  return { struct, fill }
}

// Faza 2: fileri (mikrovalne) u tavan. Radije u zoni SVOG kupca, pa na NAJBLIŽEG susjeda
// (svejedno kabina/vrata strana), s tim da ne odlutaju dublje od jedne kriške unatrag
// (LIFO — inače završe predaleko od svog kupca, kao na screenshotu). Struktura se ne dira.
function packFillers(fillers, placed, totW0, bandStart, bandEnd, van) {
  const mine = [], unplaced = []
  let totW = totW0
  let points = [{ x: 0, y: 0, z: 0 }]
  for (const p of placed) {
    points.push({ x: p.x + p.dx, y: p.y, z: p.z })
    points.push({ x: p.x, y: p.y, z: p.z + p.dz })
    points.push({ x: p.x, y: p.y + p.dy, z: p.z })
  }
  points = dedupePts(points.filter(pt => !insideAny(pt, placed)))
  for (const it of fillers) {
    const s = bandStart[it.custIdx] || 0
    const e = bandEnd[it.custIdx] || van.L
    const minX = bandStart[Math.max(0, it.custIdx - 1)] || 0 // najviše jedna kriška unatrag
    let best = null
    for (const P of points) {
      if (P.x < minX - EPS) continue
      for (const o of orientations(it)) {
        const c = { x: P.x, y: P.y, z: P.z, dx: o.dx, dy: o.dy, dz: o.dz, weight: it.weight }
        if (c.x < minX - EPS) continue
        if (!fitsBounds(c, van)) continue
        if (totW + it.weight > van.payload + EPS) continue
        if (collides(c, placed) || collides(c, mine)) continue
        if (!supported(c, [...placed, ...mine])) continue
        // Prioritet: (1) minimum pomicanja (ne blokiraj kasnije kupce); (2) bliže svojoj kriški;
        // (3) UGNIJEŽĐENO — u rupu/nišu (više prislonjenih strana), a ne izloženo na vrh frižidera
        // gdje bi moglo skliznuti; (4) niže; (5) bliže kabini. „Koliko ostane" na svog/ranijeg kupca.
        const blocked = laterBlocked(c, it.custIdx, [...placed, ...mine])
        const cxc = c.x + c.dx / 2
        const dband = cxc < s ? s - cxc : (cxc > e ? cxc - e : 0)
        const nest = containment(c, [...placed, ...mine], van)
        const k = [blocked, dband, -nest, c.y, c.x]
        if (!best || lessKey(k, best.k)) best = { c, k }
      }
    }
    if (!best) { unplaced.push(it); continue }
    const c = best.c
    mine.push({ ...it, x: c.x, y: c.y, z: c.z, dx: c.dx, dy: c.dy, dz: c.dz })
    totW += it.weight
    points.push({ x: c.x + c.dx, y: c.y, z: c.z })
    points.push({ x: c.x, y: c.y, z: c.z + c.dz })
    points.push({ x: c.x, y: c.y + c.dy, z: c.z })
    points = dedupePts(points.filter(pt => !insideAny(pt, [...placed, ...mine])))
  }
  return { mine, unplaced, totW }
}

// Može li domaćin H nositi komad L: L je strogo lakši, stane po visini kombija i H ga tlocrtno pokriva.
function canHost(H, L, van) {
  return L.weight < H.weight - 1e-6 && L.h + H.h <= van.H + EPS &&
         H.l >= L.l - EPS && H.w >= L.w - EPS
}
// ČISTI TOPPER — komad koji IMA na što sjesti (postoji teži domaćin), a SAM NIJE domaćin ničemu (ništa
// lakše ne može na njega). Samo takve IZDVAJAMO iz podnog slaganja (Faza 1) i sjedamo u zasebnoj fazi
// (seatToppers). Domaćine (npr. suđerica nosi sušilicu) DRŽIMO na podu — inače, čim negdje postoji nešto
// teže, srednji komad se krivo proglasi topperom, izgubi ulogu domaćina i nešto ispadne. Ovo je opće
// pravilo "po dimenziji i težini": vrijedi za svaki aparat, ne samo sušilicu/veš mašinu.
function isPureTopper(L, custs, products, van) {
  let hasSeat = false, isHost = false
  for (const cust of custs) {
    const qty = cust.qty || {}
    for (const k of Object.keys(qty)) {
      if (!qty[k]) continue
      const O = products[k]
      if (canHost(O, L, van)) hasSeat = true // O je teži domaćin za L
      if (canHost(L, O, van)) isHost = true  // L može nositi O → L je i sam domaćin
    }
  }
  return hasSeat && !isHost
}

// STUP (host + topper): domaćin dolje, lagani topper gore, kao JEDNA kutija za slaganje. Puna visina =
// host.h + topper.h; tlocrt = host (topper je uvijek ≤ host → stane unutra); težina = zbroj (podloga
// nosi oboje). canLie=false → stoji uspravno. Nakon slaganja se "raspakira" na dva komada. Ovako topper
// UVIJEK dobije svoj domaćin — nitko drugi ga ne može "pojesti" (korijen ranijih rubnih bugova).
function makeColumn(host, topper) {
  return { ...host, h: host.h + topper.h, weight: host.weight + topper.weight, canLie: false,
           _column: { host, topper } }
}
// Upari svaki topper s DOMAĆINOM (teži komad koji ga tlocrtno pokriva). Prioritet: najmanje pomicanja
// (topper na istog/ranijeg kupca = 0; na kasnijeg = 1), pa najbliži kupac, pa NAJLAKŠI dovoljan domaćin
// — da teži domaćini ostanu slobodni kao baza za slaganje (npr. teška perilica na te/istu ispod nje).
// Teže toppere pari prve (imaju manje mogućih domaćina). Svaki domaćin nosi najviše jedan topper;
// nespojeni topperi vraćaju se kao obična podna struktura.
function pairToppers(toppers, structAll, van) {
  const usedHost = new Set(), columns = [], leftover = []
  for (const T of [...toppers].sort((a, b) => b.weight - a.weight)) {
    let best = null
    for (const H of structAll) {
      if (usedHost.has(H) || !canHost(H, T, van)) continue
      const k = [T.custIdx < H.custIdx ? 1 : 0, Math.abs(T.custIdx - H.custIdx), H.weight]
      if (!best || lessKey(k, best.k)) best = { H, k }
    }
    if (best) { usedHost.add(best.H); columns.push({ host: best.H, topper: T }) }
    else leftover.push(T)
  }
  return { columns, leftover }
}
// Raspakiraj složene stupove: svaki placed stup → domaćin (dolje) + topper (gore, na host.h).
function explodeColumns(items) {
  const out = []
  for (const p of items) {
    if (!p._column) { out.push(p); continue }
    const { host, topper } = p._column
    const rot = Math.abs(p.dx - host.l) > 1e-6 // stup rotiran u tlocrtu (dx = host.w umjesto host.l)?
    out.push({ ...host, x: p.x, y: p.y, z: p.z,
               dx: rot ? host.w : host.l, dy: host.h, dz: rot ? host.l : host.w })
    out.push({ ...topper, x: p.x, y: p.y + host.h, z: p.z,
               dx: rot ? topper.w : topper.l, dy: topper.h, dz: rot ? topper.l : topper.w })
  }
  return out
}

// Jedan prolaz za zadanu strategiju: Faza 1 = struktura po kriškama (kabina→vrata); Faza 2 = fileri.
// deferToppers: ako true, lagani komadi (čisti topperi) UPARE se s domaćinom u STUP i slože zajedno;
// ako false, sve ide na pod (klasika). Pretraga (computeBest) usporedi obje varijante.
function packOnce(custs, van, products, structCmp, structKey, deferToppers) {
  const placed = [], unplaced = []
  let totW = 0
  const allFillers = []
  // Klasifikacija po kupcu: struktura (na pod) vs ČISTI topperi (idu gore, na domaćina).
  const perCust = custs.map((cust, ci) => {
    const { struct, fill } = customerParts(cust, ci, products, structCmp)
    allFillers.push(...fill)
    const t = [], s = []
    for (const it of struct) (deferToppers && isPureTopper(it, custs, products, van) ? t : s).push(it)
    return { s, t }
  })
  const toppers = perCust.flatMap(p => p.t)
  const structAll = perCust.flatMap(p => p.s)
  // Upari toppere s domaćinima u STUPOVE. Domaćin sa stupom → jedna kutija pune visine.
  const { columns, leftover } = pairToppers(toppers, structAll, van)
  const hostCol = new Map(); columns.forEach(c => hostCol.set(c.host, makeColumn(c.host, c.topper)))
  // Redoslijed slaganja: po kupcu (LIFO: K1, K2, K3…); unutar kupca STUP prvi (da završi u graničnoj
  // kriški, gdje topper ranijeg kupca smije biti na domaćinu kasnijeg), ostalo zadržava structCmp red.
  const structSeq = structAll.map(it => hostCol.get(it) || it).concat(leftover)
  structSeq.sort((a, b) => a.custIdx - b.custIdx || (b._column ? 1 : 0) - (a._column ? 1 : 0))
  // Faza 1: kontinuirano pakiranje strukture (BEZ resetiranja reda po kupcu), pa RASPAKIRAJ stupove.
  const rs = packCustomer(structSeq, placed, totW, 0, van, structKey)
  explodeColumns(rs.mine).forEach(p => placed.push(p))
  for (const u of rs.unplaced) u._column ? unplaced.push(u._column.host, u._column.topper) : unplaced.push(u)
  totW = rs.totW
  // Zona (band) svakog kupca iz STVARNOG rasporeda → za klasteriranje filera u Fazi 2.
  const bandStart = [], bandEnd = []
  custs.forEach((_, ci) => {
    const mine = placed.filter(p => p.custIdx === ci)
    bandStart[ci] = mine.length ? Math.min(...mine.map(p => p.x)) : 0
    bandEnd[ci] = mine.length ? Math.max(...mine.map(p => p.x + p.dx)) : bandStart[ci]
  })
  // Faza 2: fileri u tavan (grupirani po kupcu → klasteriraju u svojoj zoni).
  allFillers.sort((a, b) => a.custIdx - b.custIdx || area(b) - area(a))
  const rf = packFillers(allFillers, placed, totW, bandStart, bandEnd, van)
  rf.mine.forEach(p => placed.push(p))
  unplaced.push(...rf.unplaced)
  totW = rf.totW
  // Redoslijed utovara/uputa: kabina→vrata, odozdo→gore.
  placed.sort((a, b) => a.custIdx - b.custIdx || a.x - b.x || a.y - b.y || a.z - b.z)
  placed.forEach((p, i) => { p.order = i })
  const up = unloadPlan(placed)
  const usedVol = placed.reduce((s, p) => s + p.dx * p.dy * p.dz, 0)
  const score = { n: placed.length, vol: usedVol, moves: up.moves, w: totW }
  return { placed, unplaced, weight: totW, up, score, deferred: deferToppers && toppers.length > 0 }
}

// Bolji raspored: najviše utovareno → najveći volumen (gušće) → najmanje pomicanja → najveća masa.
function betterResult(a, b) {
  if (a.score.n !== b.score.n) return a.score.n > b.score.n
  if (Math.abs(a.score.vol - b.score.vol) > 1e-6) return a.score.vol > b.score.vol
  if (a.score.moves !== b.score.moves) return a.score.moves < b.score.moves
  return a.score.w > b.score.w
}

// Izbor između svih varijanti: (1) NAJVIŠE komada (max-load je kralj — nikad ne gubi artikl),
// (2) NAJMANJE pomicanja (čist LIFO; ne reorganiziraj u više micanja bez potrebe), (3) na izjednačenju
// pomicanja → PODIGNUTA varijanta (kompaktnije), (4) inače standardni betterResult.
function pickBetter(a, b) {
  if (a.score.n !== b.score.n) return a.score.n > b.score.n
  if (a.score.moves !== b.score.moves) return a.score.moves < b.score.moves
  if (a.deferred !== b.deferred) return a.deferred
  return betterResult(a, b)
}

// Glavni ulaz: MAX-LOAD pretraga — probaj sve strategije (redoslijed × ključ) × {s podizanjem, bez},
// vrati najbolji valjani LIFO raspored. Dodavanje strategija/varijanti nikad ne pogorša (monoton max).
export function computeBest(custs, van, products) {
  let best = null
  for (const structCmp of STRUCT_CMPS) {
    for (const structKey of STRUCT_KEYS) {
      for (const defer of [true, false]) {
        const r = packOnce(custs, van, products, structCmp, structKey, defer)
        if (!best || pickBetter(r, best)) best = r
      }
    }
  }
  return best
}
