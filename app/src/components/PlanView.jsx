import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { loadPlan } from '../lib/db'
import VanScene from './VanScene'

export default function PlanView({ planId, onExit }) {
  const [plan, setPlan] = useState(null)
  const [err, setErr] = useState('')
  const [step, setStep] = useState(0)

  useEffect(() => {
    let alive = true
    loadPlan(planId)
      .then((p) => { if (alive) setPlan(p) })
      .catch((e) => { if (alive) setErr(e.message) })
    return () => { alive = false }
  }, [planId])

  const d = plan?.data
  const van = d?.vehicle

  const boxesSorted = useMemo(() => {
    if (!d) return []
    return (d.boxes || []).slice()
      .sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z)
      .map((p, i) => ({ ...p, step: i }))
  }, [d])

  const n = boxesSorted.length
  useEffect(() => { setStep(n) }, [n])
  const visible = step >= n ? boxesSorted : boxesSorted.filter((p) => p.step < step)

  if (err) return <div className="fullmsg err">Greška pri otvaranju plana:<br />{err}</div>
  if (!plan || !van) return <div className="fullmsg">Učitavam plan…</div>

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href) } catch { /* ignore */ }
  }

  return (
    <div id="app">
      <div id="panel">
        <div className="panelhead"><h1>{plan.name}</h1></div>
        <div className="toolbar">
          {onExit && <button className="btn ghost sm" onClick={onExit}>← Natrag</button>}
          <button className="btn ghost sm" onClick={copyLink}>Kopiraj link</button>
        </div>
        <div className="van-info">
          {van.name} {van.L.toFixed(1)} × {van.W.toFixed(1)} × {van.H.toFixed(2)} m · nosivost {van.payload} kg · vrata straga
        </div>

        <div className="order">
          <h4>Plan istovara (redom rute)</h4>
          {(d.unloadSteps || []).map((s, i) => (
            <div className="ustep" key={i}>
              <b>{i + 1}. {s.name}</b> · {s.count} kom
              {s.blockers && s.blockers.length
                ? <div className="move">↳ prvo pomakni: {s.blockers.map((b) => `${b.name} (${b.custName})`).join(', ')}</div>
                : <div className="okline">↳ slobodan pristup</div>}
            </div>
          ))}
        </div>

        <div className="stats">
          <div>Ukupno: <b>{n}</b> kom · <b>{Math.round(d.weight)}</b> kg</div>
          {d.unplaced && d.unplaced.length > 0 &&
            <div className="warn">Nije stalo: {d.unplaced.length} kom ({d.unplaced.map((u) => u.name).join(', ')}).</div>}
        </div>

        <div className="legend">
          <div className="legtitle">Kupci (utovar: kabina → vrata)</div>
          {(d.customers || []).map((c, ci) => {
            const items = boxesSorted.filter((p) => p.custIdx === ci)
            const w = items.reduce((s, p) => s + (p.weight || 0), 0)
            return (
              <div className="legrow" key={ci}>
                <span className="sw" style={{ background: c.color }} /> {ci + 1}. {c.name} · {items.length} kom{w ? ` · ${Math.round(w)} kg` : ''}
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
          <VanScene boxes={visible} van={van} />
          <OrbitControls target={[0, van.H / 2, 0]} enableDamping minDistance={2.5} maxDistance={18} />
        </Canvas>
        <div className="hint">Povuci = rotacija · dva prsta / kotačić = zoom</div>
      </div>
    </div>
  )
}
