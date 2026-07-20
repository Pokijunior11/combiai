import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import VanScene from './VanScene'
import { buildLoadSteps, stepView } from '../lib/loadSteps'
import { readProgress, writeProgress } from '../lib/loadProgress'

// Način „korak po korak" za skladištara (tablet na nosaču na kombiju).
// Spec: docs/PLAN.md §4d „SPEC — Način utovara".
// Tvrdo: ide se STROGO redom (nema preskakanja), naprijed/natrag u svakom trenutku,
// korak se PAMTI (tablet se ugasi → nastavlja gdje je stao). Klizača nema — samo velike tipke.

export default function LoadMode({ orderId, title, best, van, onExit }) {
  const steps = useMemo(() => buildLoadSteps(best.placed, van), [best, van])
  const n = steps.length

  // Zapamćeni korak čitamo JEDNOM, pri ulasku (lijeni init) — ne pri svakom renderu.
  const [i, setI] = useState(() => readProgress(orderId, n)?.i ?? 0)

  useEffect(() => { writeProgress(orderId, { active: true, i }) }, [orderId, i])

  // Ako se plan smanjio pod nogama, ne ostavljaj korak izvan dosega.
  useEffect(() => { setI((v) => Math.min(v, n)) }, [n])

  // Sva logika koraka je čista funkcija (testirana u tools/loadsteps-bench.mjs).
  const { done, cur, next: nxt, stats, boxes } = useMemo(() => stepView(steps, i, van), [steps, i, van])

  return (
    <div className="lm">
      <div className="lm-top">
        <div className="lm-title">{title}</div>
        <div className="lm-step">{done ? 'GOTOVO' : `KORAK ${i + 1} / ${n}`}</div>
        <button className="lm-exit" onClick={onExit}>✕ Prekini</button>
      </div>

      <div className="lm-body">
        <aside className="lm-side">
          <div className="lm-stat">
            <span>Utovareno</span><b>{stats.loaded} / {stats.total}</b>
            <div className="lm-bar"><div style={{ width: `${n ? (stats.loaded / n) * 100 : 0}%`, background: '#2a6df4' }} /></div>
          </div>
          <div className="lm-stat">
            <span>Prostor</span><b>{stats.volPct.toFixed(0)} %</b>
            <div className="lm-bar"><div style={{ width: `${stats.volPct.toFixed(0)}%`, background: '#5b8def' }} /></div>
          </div>
          <div className="lm-stat">
            <span>Težina</span><b>{stats.kg.toFixed(0)} / {van.payload} kg</b>
            <div className="lm-bar"><div style={{ width: `${stats.kgPct.toFixed(0)}%`, background: '#1a8a4a' }} /></div>
          </div>
        </aside>

        <div className="lm-3d">
          <Canvas camera={{ position: [4.6, 3.6, 5.2], fov: 45 }}>
            <color attach="background" args={['#cdd5e0']} />
            <VanScene boxes={boxes} van={van} />
            <OrbitControls target={[0, van.H / 2, 0]} enableDamping minDistance={2.5} maxDistance={18} />
          </Canvas>
          <div className="lm-legend">
            <span><i className="sw done" /> utovareno</span>
            <span><i className="sw cur" /> OVAJ</span>
            <span><i className="sw next" /> sljedeći</span>
          </div>
        </div>
      </div>

      <div className="lm-bottom">
        {done ? (
          <div className="lm-card lm-card-done">
            <div className="lm-donemsg">✓ Utovar gotov — svih {n} artikala je u kombiju.</div>
          </div>
        ) : (
          <div className="lm-card">
            <div className="lm-code">{cur.code || cur.name}</div>
            <div className="lm-name">{cur.name}</div>
            <div className="lm-ean">{cur.ean ? formatEan(cur.ean) : 'nema barkoda'}</div>
            <div className="lm-where">
              <b>{cur.spot.headline}</b>
              <span>{cur.spot.layer} · {cur.spot.depth}</span>
            </div>
            <div className="lm-dims">
              {cur.weight.toFixed(0)} kg · {Math.round(cur.dims.dx * 100)} × {Math.round(cur.dims.dz * 100)} × {Math.round(cur.dims.dy * 100)} cm
            </div>
          </div>
        )}

        <div className="lm-next">
          <div className="lm-nextlab">ZATIM</div>
          {nxt
            ? <><div className="lm-nextcode">{nxt.code || nxt.name}</div>
                <div className="lm-nextwhere">{nxt.spot.headline} · {nxt.spot.layer}</div></>
            : <div className="lm-nextwhere">{done ? '—' : 'ovo je zadnji artikl'}</div>}
        </div>
      </div>

      <div className="lm-nav">
        <button className="lm-btn back" disabled={i <= 0} onClick={() => setI((v) => Math.max(0, v - 1))}>◀ NATRAG</button>
        <button className="lm-btn fwd" disabled={done} onClick={() => setI((v) => Math.min(n, v + 1))}>SLJEDEĆE ▶</button>
      </div>
    </div>
  )
}

// EAN-13 čitljivo razlomljen: 5 949123 456789 — lakše za usporedbu s naljepnicom na kutiji.
function formatEan(ean) {
  const s = String(ean).replace(/\D/g, '')
  return s.length === 13 ? `${s[0]} ${s.slice(1, 7)} ${s.slice(7)}` : s
}
