import { useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import VanScene from './VanScene'
import { orderForLoading } from '../lib/loadSteps'

// 3D prikaz + klizač/tipke „korak utovara".
// Klizač je PLANEROV alat (brzo prelista kako se slaže dok slaže narudžbu). Skladištar ga NEMA —
// kod njega kroz korake vodi LoadMode velikim tipkama, pa bi dva klizača bila dva izvora istine.
export default function VanStage({ boxes, van, showSlider = true }) {
  // Isti topološki redoslijed kojim ide i način „korak po korak" (lib/loadSteps.js) —
  // inače bi klizač i upute skladištaru govorili različito.
  const boxesSorted = useMemo(() => orderForLoading(boxes), [boxes])
  const n = boxesSorted.length
  const [step, setStep] = useState(n)
  useEffect(() => { setStep(n) }, [n])
  const visible = step >= n ? boxesSorted : boxesSorted.filter((p) => p.step < step)

  return (
    <div id="stage">
      {showSlider && <div id="stepwrap">
        <span className="steplabel">Korak utovara</span>
        <button className="stepbtn" disabled={step <= 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>◀</button>
        <input type="range" min={0} max={n} value={step} onChange={(e) => setStep(+e.target.value)} />
        <button className="stepbtn" disabled={step >= n} onClick={() => setStep((s) => Math.min(n, s + 1))}>▶</button>
        <span className="stepcount">{step} / {n}</span>
      </div>}
      <Canvas camera={{ position: [4.6, 3.6, 5.2], fov: 45 }}>
        <color attach="background" args={['#cdd5e0']} />
        <VanScene boxes={visible} van={van} />
        <OrbitControls target={[0, van.H / 2, 0]} enableDamping minDistance={2.5} maxDistance={18} />
      </Canvas>
      <div className="hint">Povuci = rotacija · dva prsta / kotačić = zoom</div>
    </div>
  )
}
