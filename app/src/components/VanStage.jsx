import { useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import VanScene from './VanScene'

// 3D prikaz + klizač/tipke „korak utovara". Koriste ga i planer i skladištar.
export default function VanStage({ boxes, van }) {
  const boxesSorted = useMemo(
    () => boxes.slice().sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z).map((p, i) => ({ ...p, step: i })),
    [boxes],
  )
  const n = boxesSorted.length
  const [step, setStep] = useState(n)
  useEffect(() => { setStep(n) }, [n])
  const visible = step >= n ? boxesSorted : boxesSorted.filter((p) => p.step < step)

  return (
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
  )
}
