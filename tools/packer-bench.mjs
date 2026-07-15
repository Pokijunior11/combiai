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

// ---- red se NE smije prekinuti na granici kupca (screenshot 14:16) ----
run('CASE-7  K1{H4,M1} K2{H2} K3{H5} — bez praznih slotova na granici', [{hladnjak:4,mikro:1},{hladnjak:2},{hladnjak:5}])
// ---- filer ide UNATRAG na raniji kupac (na tavan K1), ne naprijed na K3 (screenshot 14:25) ----
run('CASE-8  K1{H1,S2} K2{H2,M8} K3{H4} — K2 mikrovalne na K1 tavan, 0 pomicanja', [{hladnjak:1,susilica:2},{hladnjak:2,mikro:8},{hladnjak:4}])

// ---- MAX-LOAD: dodavanje artikla NE smije "otključati" ostale (lažni ne-stane, screenshot 09:49) ----
run('CASE-11 K1{H2,M4,PP1,PR2,TV1} K2{H2,MF10,M4,TV3} K3{H3} — sve mora stati (bez lažnog ne-stane)',
  [{hladnjak:2,mikro:4,posudje:1,perilica:2,televizor:1},{hladnjak:2,mfrizider:10,mikro:4,televizor:3},{hladnjak:3}])

// ---- filer se gnijezdi U RUPU (contained), ne penje izloženo na vrh frižidera (screenshot 16:52) ----
run('CASE-10 K1{H2,perilica1,M4} — mikrovalne u nišu iznad veš mašine, ne na vrh frižidera',
  [{hladnjak:2,perilica:1,mikro:4}])

// ---- topper preko granice: lagana sušilica K1 sjedne NA tešku veš mašinu K2 (screenshot 10:51) ----
run('CASE-12 K1{H2,S1} K2{H2,PR1} K3{H12} — sušilica K1 na veš mašinu K2 (1 pomicanje)',
  [{hladnjak:2,susilica:1},{hladnjak:2,perilica:1},{hladnjak:12}])

// ---- univerzalnost toppera: dodavanje K2 sušilice NE smije izbaciti K1 sušilicu (screenshot 13:48) ----
run('CASE-13 K1{H3,S1} K2{H2,PR1,S1} — obje sušilice stanu (K1 na veš mašinu, K2 na pod)',
  [{hladnjak:3,susilica:1},{hladnjak:2,perilica:1,susilica:1},{}])

// ---- topper radi na SVAKI teži komad, ne samo veš mašinu (suđerica/štednjak) (screenshot 14:35) ----
run('CASE-14a suđerica K1{H2,S1} K2{H3,PP1} — sušilica na suđericu (kao na veš mašinu)',
  [{hladnjak:2,susilica:1},{hladnjak:3,posudje:1},{}])
run('CASE-14b štednjak K1{H2,S1} K2{H3,ST1} — sušilica na štednjak',
  [{hladnjak:2,susilica:1},{hladnjak:3,stednjak:1},{}])

// ---- puni po redu; digni tek kad se napuni. Dodavanje istotežinske perilice NE smije napraviti
// višak micanja — zelena perilica sjedne na plavu (K3 na K2), 0 pomicanja (screenshot 15:30) ----
run('CASE-16 K1{H2,S1} K2{H5,PR1,S1} K3{H8,PR1} — čist LIFO, 0 pomicanja',
  [{hladnjak:2,susilica:1},{hladnjak:5,perilica:1,susilica:1},{hladnjak:8,perilica:1}])

// ---- STUP: topper uvijek dobije domaćina, i kad kupac ima DVA domaćina (dupli), i kad je domaćin
// lakši od nečeg u kasnijem kupcu. Prije je sušilica/frižider ispadao (screenshot 09:53) ----
run('CASE-17 K1{H2,S1} K2{H5,PP1,PR1} K3{H9,PP1} — dupli domaćin u K2, sve 20 stane',
  [{hladnjak:2,susilica:1},{hladnjak:5,posudje:1,perilica:1},{hladnjak:9,posudje:1}])
run('CASE-18 K1{H2,S1} K2{H5,PP1} K3{H9,PR1,ST1} — domaćin (PP) lakši od PR/ST u K3, sve 20 stane',
  [{hladnjak:2,susilica:1},{hladnjak:5,posudje:1},{hladnjak:9,perilica:1,stednjak:1}])

// ---- pairanje bira NAJLAKŠEG domaćina za topper (da najteži ostane baza): K3 perilica rublja (70,
// najteža, mora na pod/na istu) ne smije ispasti jer je stup zauzeo K2 PR (screenshot 10:17) ----
run('CASE-19 K1{H2,S1} K2{H5,PP1,PR1} K3{H9,PR1} — sušilica na PP (ne PR), K3 PR na K2 PR, sve 20',
  [{hladnjak:2,susilica:1},{hladnjak:5,posudje:1,perilica:1},{hladnjak:9,perilica:1}])

// ---- struktura kasnijeg kupca NE SMIJE natrag na tavan ranijeg (screenshot 15:05) ----
run('CASE-9  K1{H2,MF3,posudje1,perilica1,stednjak1} K2{H5} K3{H2,MF1,susilica1,M11} — zelena struktura ne ide natrag',
  [{hladnjak:2,mfrizider:3,posudje:1,perilica:1,stednjak:1},{hladnjak:5},{hladnjak:2,mfrizider:1,susilica:1,mikro:11}])

// ---- stog test: niske stvari se MORAJU slagati u vis, ne razvući po podu ----
run('CASE-5  stog: K1{sušilica8, posudje4} — grade se u vis', [{susilica:8,posudje:4}])
run('CASE-6  mali frižideri: K1{mfrizider12} — liježu/slažu u vis', [{mfrizider:12}])

// ---- referentna provjera: koliko čistih frižidera stane (bez malih) ----
run('REF  12 frižidera (1 kupac) — moraju stati na pod', [{hladnjak:12}])
run('REF  18 frižidera — koliko stane na pod', [{hladnjak:18}])
