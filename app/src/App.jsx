import { useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { VAN, PRODUCTS, DEFAULT_CUSTOMERS, EXAMPLES } from './data/catalog'
import { computeBest } from './lib/packer'
import VanScene from './components/VanScene'
import './App.css'

const PKEYS = Object.keys(PRODUCTS)
const clone = (c) => c.map((x) => ({ ...x, qty: { ...x.qty } }))

export default function App() {
  const [customers, setCustomers] = useState(clone(DEFAULT_CUSTOMERS))
  const [numCust, setNumCust] = useState(3)
  const [step, setStep] = useState(0)

  const active = customers.slice(0, numCust)

  const best = useMemo(
    () => computeBest(active, VAN, PRODUCTS),
    [customers, numCust], // active se izvodi iz njih
  )

  // korak utovara: redom od kabine (x=0) prema vratima, niže prije višeg
  const boxesSorted = useMemo(() => {
    return best.placed
      .slice()
      .sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z)
      .map((p, i) => ({ ...p, step: i }))
  }, [best])

  const n = boxesSorted.length
  useEffect(() => { setStep(n) }, [n])

  const visible = step >= n ? boxesSorted : boxesSorted.filter((p) => p.step < step)

  // statistika
  const vanVol = VAN.L * VAN.W * VAN.H
  const usedVol = best.placed.reduce((s, p) => s + p.dx * p.dy * p.dz, 0)
  const util = (usedVol / vanVol) * 100
  const weight = best.weight
  const wPct = Math.min(100, (weight / VAN.payload) * 100)
  const over = weight > VAN.payload
  const maxY = best.placed.reduce((m, p) => Math.max(m, p.y + p.dy), 0)

  // uređivanje
  const changeQty = (ci, k, d) => {
    setCustomers((prev) => {
      const next = clone(prev)
      next[ci].qty[k] = Math.max(0, (next[ci].qty[k] || 0) + d)
      return next
    })
  }
  const loadExample = (x) => {
    setCustomers((prev) => {
      const next = clone(prev)
      EXAMPLES[x].forEach((qty, i) => { if (next[i]) next[i].qty = { ...qty } })
      return next
    })
  }

  return (
    <div id="app">
      <div id="panel">
        <h1>Utovar kombija</h1>
        <p className="sub">Auto-raspored · slaganje u vis · LIFO (istovar obrnut od utovara)</p>
        <div className="van-info">
          Kombi {VAN.L.toFixed(1)} × {VAN.W.toFixed(1)} × {VAN.H.toFixed(2)} m · nosivost {VAN.payload} kg · vrata straga · <b>Kupac 1 = uz kabinu</b>
        </div>

        <div className="seg">
          {[2, 3].map((nn) => (
            <button key={nn} className={numCust === nn ? 'on' : ''} onClick={() => setNumCust(nn)}>{nn} kupca</button>
          ))}
        </div>
        <div className="seg">
          <button onClick={() => loadExample('a')}>Primjer A</button>
          <button onClick={() => loadExample('b')}>Primjer B</button>
        </div>

        <table>
          <thead>
            <tr>
              <th className="prod">Artikl</th>
              {active.map((c, ci) => (
                <th key={ci}><span className="chead"><span className="dot" style={{ background: c.color }} />{ci + 1}.</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PKEYS.map((k) => {
              const p = PRODUCTS[k]
              return (
                <tr key={k}>
                  <td className="prod">
                    <div className="pname">{p.name}</div>
                    <div className="pdim">{(p.l * 100) | 0}×{(p.w * 100) | 0}×{(p.h * 100) | 0}cm · {p.weight}kg{p.canLie ? ' · liježe' : ''}</div>
                  </td>
                  {active.map((c, ci) => (
                    <td key={ci}>
                      <span className="mini">
                        <button onClick={() => changeQty(ci, k, -1)}>−</button>
                        <span>{c.qty[k] || 0}</span>
                        <button onClick={() => changeQty(ci, k, 1)}>+</button>
                      </span>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="stats">
          <div>Iskorištenost prostora: <b>{util.toFixed(1)}%</b></div>
          <div className="bar"><div style={{ width: `${util.toFixed(0)}%`, background: '#2a6df4' }} /></div>
          <div>Težina: <b>{weight.toFixed(0)} / {VAN.payload} kg</b></div>
          <div className="bar"><div style={{ width: `${wPct.toFixed(0)}%`, background: over ? '#c0392b' : '#1a8a4a' }} /></div>
          <div>Utovareno: <b>{n}</b> kom · najviši stup <b>{maxY.toFixed(2)} m</b></div>
          <div>Pomicanja pri istovaru: <b>{best.up.moves}</b></div>
          {best.unplaced.length
            ? <div className="warn">Nije stalo: {best.unplaced.length} kom ({best.unplaced.map((u) => u.name).join(', ')}).</div>
            : <div className="ok">✓ Sve stane.</div>}
          {over && <div className="warn">Prekoračena nosivost — makni nešto ili drugi kombi.</div>}
        </div>

        <div className="order">
          <h4>Plan istovara (redom rute)</h4>
          {best.up.steps.map((s, i) => (
            <div className="ustep" key={i}>
              <b>{i + 1}. {s.name}</b> · {s.count} kom
              {s.blockers.length
                ? <div className="move">↳ prvo pomakni: {s.blockers.map((b) => `${b.name} (${b.custName})`).join(', ')}</div>
                : <div className="okline">↳ slobodan pristup</div>}
            </div>
          ))}
        </div>

        <div className="legend">
          <div className="legtitle">Kupci (utovar: kabina → vrata)</div>
          {active.map((c, ci) => {
            const items = best.placed.filter((p) => p.custIdx === ci)
            const w = items.reduce((s, p) => s + p.weight, 0)
            return (
              <div className="legrow" key={ci}>
                <span className="sw" style={{ background: c.color }} /> {ci + 1}. {c.name} · {items.length} kom · {w.toFixed(0)} kg
              </div>
            )
          })}
        </div>
      </div>

      <div id="stage">
        <div id="stepwrap">
          <span className="steplabel">Korak utovara</span>
          <button className="stepbtn" disabled={step <= 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>◀</button>
          <input type="range" min={0} max={n} value={step} onChange={(e) => setStep(+e.target.value)} />
          <button className="stepbtn" disabled={step >= n} onClick={() => setStep((s) => Math.min(n, s + 1))}>▶</button>
          <span className="stepcount">{step} / {n}</span>
        </div>
        <Canvas camera={{ position: [4.6, 3.6, 5.2], fov: 45 }}>
          <color attach="background" args={['#cdd5e0']} />
          <VanScene boxes={visible} />
          <OrbitControls target={[0, VAN.H / 2, 0]} enableDamping minDistance={2.5} maxDistance={18} />
        </Canvas>
        <div className="hint">Povuci = rotacija · dva prsta / kotačić = zoom</div>
      </div>
    </div>
  )
}
