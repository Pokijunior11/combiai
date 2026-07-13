// Mjerilo (benchmark) za motor slaganja. Pokreni: node tools/packer-bench.mjs
// Reproducira screenshot-slučajeve i mjeri: utovareno, neutovareno, %, kg, pomicanja, valjanost.
import { computeBest } from '../app/src/lib/packer.js'
import { VAN, PRODUCTS } from '../app/src/data/catalog.js'

const EPS = 1e-6
const COLORS = ['#e0783f', '#2f7dd1', '#4fa06a']
const cust = (qty) => qty.map((q, i) => ({ name: `Kupac ${i + 1}`, color: COLORS[i], qty: q }))

// ---- validacija tvrdih pravila ----
function overlap(a, b) {
  return a.x < b.x+b.dx-EPS && b.x < a.x+a.dx-EPS &&
         a.y < b.y+b.dy-EPS && b.y < a.y+a.dy-EPS &&
         a.z < b.z+b.dz-EPS && b.z < a.z+a.dz-EPS
}
function unionArea(rects) {
  const xs = [...new Set(rects.flatMap(r => [r.x0, r.x1]))].sort((a,b)=>a-b)
  const zs = [...new Set(rects.flatMap(r => [r.z0, r.z1]))].sort((a,b)=>a-b)
  let A = 0
  for (let i=0;i<xs.length-1;i++) for (let j=0;j<zs.length-1;j++) {
    const cx=(xs[i]+xs[i+1])/2, cz=(zs[j]+zs[j+1])/2
    if (rects.some(r=>cx>r.x0&&cx<r.x1&&cz>r.z0&&cz<r.z1)) A += (xs[i+1]-xs[i])*(zs[j+1]-zs[j])
  }
  return A
}
function validate(placed) {
  const errs = []
  for (const p of placed) {
    if (p.x<-EPS||p.y<-EPS||p.z<-EPS||p.x+p.dx>VAN.L+EPS||p.y+p.dy>VAN.H+EPS||p.z+p.dz>VAN.W+EPS) errs.push('izvan granica: '+p.name)
  }
  for (let i=0;i<placed.length;i++) for (let j=i+1;j<placed.length;j++)
    if (overlap(placed[i],placed[j])) errs.push(`preklapanje: ${placed[i].name}×${placed[j].name}`)
  for (const p of placed) {
    if (p.y<=EPS) continue
    const rects = []
    for (const o of placed) {
      if (o===p) continue
      if (Math.abs(o.y+o.dy-p.y)<1e-4) {
        const x0=Math.max(o.x,p.x),x1=Math.min(o.x+o.dx,p.x+p.dx),z0=Math.max(o.z,p.z),z1=Math.min(o.z+o.dz,p.z+p.dz)
        if (x1-x0>EPS&&z1-z0>EPS){ if(p.weight>o.weight+1e-6) errs.push('teže na lakše: '+p.name); rects.push({x0,x1,z0,z1}) }
      }
    }
    if (!rects.length || unionArea(rects) < p.dx*p.dz-1e-3) errs.push('nema pun oslonac: '+p.name)
  }
  return errs
}

function run(tag, qty) {
  const custs = cust(qty)
  const t0 = performance.now()
  const best = computeBest(custs, VAN, PRODUCTS)
  const ms = performance.now() - t0
  const vanVol = VAN.L*VAN.W*VAN.H
  const usedVol = best.placed.reduce((s,p)=>s+p.dx*p.dy*p.dz,0)
  const errs = validate(best.placed)
  const unplacedCounts = {}
  best.unplaced.forEach(u => { unplacedCounts[u.name] = (unplacedCounts[u.name]||0)+1 })
  const unpStr = Object.entries(unplacedCounts).map(([n,c])=>`${c}×${n}`).join(', ') || '—'
  console.log(`\n== ${tag} ==`)
  console.log(`  utovareno=${best.placed.length}  neutovareno=${best.unplaced.length} [${unpStr}]`)
  console.log(`  iskorištenost=${(usedVol/vanVol*100).toFixed(1)}%  masa=${Math.round(best.weight)}/${VAN.payload}kg  pomicanja=${best.up.moves}  (${ms.toFixed(0)}ms)`)
  console.log(`  valjanost: ${errs.length ? 'GREŠKE → '+errs.slice(0,4).join(' | ') : 'OK'}`)
  return best
}

// ---- screenshot slučajevi ----
run('CASE-1a  K1{H1,M16,S2} K2{H4} K3{H7}', [{hladnjak:1,mikro:16,susilica:2},{hladnjak:4},{hladnjak:7}])
run('CASE-1b  isto ali M17 (BUG: 2 hladnjaka ispadnu)', [{hladnjak:1,mikro:17,susilica:2},{hladnjak:4},{hladnjak:7}])
run('CASE-3   K1{H1,M16,S2} K2{H4,M12} K3{H7}', [{hladnjak:1,mikro:16,susilica:2},{hladnjak:4,mikro:12},{hladnjak:7}])
run('CASE-4   K1{H1,M11,S2} K2{H6} K3{H7,M6}', [{hladnjak:1,mikro:11,susilica:2},{hladnjak:6},{hladnjak:7,mikro:6}])

// ---- referentna provjera: koliko čistih frižidera stane (bez malih) ----
run('REF  12 frižidera (1 kupac) — moraju stati na pod', [{hladnjak:12}])
run('REF  18 frižidera — koliko stane na pod', [{hladnjak:18}])
