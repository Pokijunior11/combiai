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

function tryPack(items, placeKey, van) {
  const placed = [], unplaced = []
  let totW = 0
  let points = [{ x:0, y:0, z:0 }]
  for (const it of items) {
    let best = null
    for (const P of points) {
      for (const o of orientations(it)) {
        const c = { x:P.x, y:P.y, z:P.z, dx:o.dx, dy:o.dy, dz:o.dz, weight:it.weight }
        if (!fitsBounds(c, van)) continue
        if (totW + it.weight > van.payload + EPS) continue
        if (collides(c, placed)) continue
        if (!supported(c, placed)) continue
        const k = placeKey(c)
        if (!best || lessKey(k, best.k)) best = { c, k }
      }
    }
    if (!best) { unplaced.push(it); continue }
    const c = best.c
    placed.push({ ...it, x:c.x, y:c.y, z:c.z, dx:c.dx, dy:c.dy, dz:c.dz, order:placed.length })
    totW += it.weight
    points.push({ x:c.x+c.dx, y:c.y, z:c.z })
    points.push({ x:c.x, y:c.y, z:c.z+c.dz })
    points.push({ x:c.x, y:c.y+c.dy, z:c.z })
    points = dedupePts(points.filter(pt => !insideAny(pt, placed)))
  }
  return { placed, unplaced, weight: totW }
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

const area = it => it.l * it.w
const keyYXZ = c => [c.y, c.x, c.z]
const keyXYZ = c => [c.x, c.y, c.z]
const keyYZX = c => [c.y, c.z, c.x]
const STRATS = [
  { cmp: (a,b) => area(b)-area(a) || b.weight-a.weight || b.h-a.h, place: keyYXZ },
  { cmp: (a,b) => b.h-a.h || area(b)-area(a) || b.weight-a.weight, place: keyXYZ },
  { cmp: (a,b) => b.weight-a.weight || area(b)-area(a) || b.h-a.h, place: keyYZX },
]

function makeItems(custs, cmp, products) {
  const arr = []
  custs.forEach((c, ci) => {
    const list = []
    for (const k of Object.keys(products)) {
      const n = (c.qty && c.qty[k]) || 0
      for (let i=0;i<n;i++) {
        const p = products[k]
        list.push({ ...p, key:k, custName:c.name, custIdx:ci, color:c.color })
      }
    }
    list.sort(cmp)
    arr.push(...list)
  })
  return arr
}
function better(a, b) {
  if (a.n !== b.n) return a.n > b.n
  if (a.moves !== b.moves) return a.moves < b.moves
  return a.w > b.w
}

// Glavni ulaz: probaj sve strategije, vrati najbolji raspored + plan istovara.
export function computeBest(custs, van, products) {
  let best = null
  for (const st of STRATS) {
    const r = tryPack(makeItems(custs, st.cmp, products), st.place, van)
    const up = unloadPlan(r.placed)
    const score = { n: r.placed.length, moves: up.moves, w: r.weight }
    const cand = { ...r, up, score }
    if (!best || better(score, best.score)) best = cand
  }
  return best
}
