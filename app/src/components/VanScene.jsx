import { Edges, Html } from '@react-three/drei'
import { VAN } from '../data/catalog'

function Box({ p }) {
  const cx = p.x + p.dx / 2 - VAN.L / 2
  const cy = p.y + p.dy / 2
  const cz = p.z + p.dz / 2 - VAN.W / 2
  return (
    <mesh position={[cx, cy, cz]}>
      <boxGeometry args={[p.dx, p.dy, p.dz]} />
      <meshStandardMaterial color={p.color} />
      <Edges color="#1c2a38" />
    </mesh>
  )
}

const labelStyle = (bg) => ({
  background: bg, color: '#fff', padding: '2px 8px', borderRadius: 5,
  fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', pointerEvents: 'none',
  fontFamily: 'sans-serif',
})

export default function VanScene({ boxes }) {
  const { L, W, H } = VAN
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 8, 5]} intensity={0.7} />
      <directionalLight position={[-5, 4, -4]} intensity={0.3} />

      {/* gabarit kombija */}
      <mesh position={[0, H / 2, 0]}>
        <boxGeometry args={[L, H, W]} />
        <meshBasicMaterial transparent opacity={0} />
        <Edges color="#33465e" />
      </mesh>

      {/* pod */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[L, W]} />
        <meshBasicMaterial color="#6f8bb0" transparent opacity={0.08} side={2} />
      </mesh>

      {/* vrata (straga, +X) */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[L / 2, H / 2, 0]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial color="#c0392b" transparent opacity={0.1} side={2} />
      </mesh>

      <Html position={[L / 2 + 0.1, H + 0.15, 0]} center>
        <div style={labelStyle('#c0392b')}>VRATA / istovar</div>
      </Html>
      <Html position={[-L / 2 - 0.1, H + 0.15, 0]} center>
        <div style={labelStyle('#5a6472')}>kabina</div>
      </Html>

      {boxes.map((p, i) => <Box key={i} p={p} />)}
    </>
  )
}
