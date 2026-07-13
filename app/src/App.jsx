import { useMemo, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { DEFAULT_CUSTOMERS, EXAMPLES } from './data/catalog'
import { computeBest } from './lib/packer'
import { fetchArticles, fetchVehicle, saveOrder, loadOrder } from './lib/db'
import VanScene from './components/VanScene'
import CatalogEditor from './components/CatalogEditor'
import OrdersList from './components/OrdersList'
import './App.css'

const cloneCust = (c) => c.map((x) => ({ ...x, qty: { ...x.qty } }))
// mapiraj količine iz šifri (npr. 'perilica') u id-eve iz baze
const mapQty = (codeQty, codeToId) => {
  const out = {}
  for (const [code, n] of Object.entries(codeQty || {})) {
    const id = codeToId[code]
    if (id) out[id] = n
  }
  return out
}

export default function App() {
  const [productList, setProductList] = useState([])
  const [vehicle, setVehicle] = useState(null)
  const [customers, setCustomers] = useState([])
  const [numCust, setNumCust] = useState(3)
  const [step, setStep] = useState(0)
  const [view, setView] = useState('plan') // 'plan' | 'catalog' | 'orders'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 2500) }

  const productsById = useMemo(
    () => Object.fromEntries(productList.map((p) => [p.id, p])),
    [productList],
  )

  async function initialLoad() {
    setLoading(true); setError('')
    try {
      const [arts, veh] = await Promise.all([fetchArticles(), fetchVehicle()])
      const c2i = Object.fromEntries(arts.filter((p) => p.code).map((p) => [p.code, p.id]))
      setProductList(arts)
      setVehicle(veh)
      setCustomers(DEFAULT_CUSTOMERS.map((c) => ({ name: c.name, color: c.color, qty: mapQty(c.qty, c2i) })))
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }
  // refetch nakon uređivanja kataloga — NE dira trenutnu narudžbu
  async function refetchCatalog() {
    const [arts, veh] = await Promise.all([fetchArticles(), fetchVehicle()])
    setProductList(arts)
    setVehicle(veh)
  }

  useEffect(() => { initialLoad() }, [])

  const active = customers.slice(0, numCust)
  const codeToId = useMemo(
    () => Object.fromEntries(productList.filter((p) => p.code).map((p) => [p.code, p.id])),
    [productList],
  )

  const best = useMemo(() => {
    if (!vehicle || productList.length === 0 || customers.length === 0) return null
    return computeBest(active, vehicle, productsById)
  }, [customers, numCust, vehicle, productsById])

  const boxesSorted = useMemo(() => {
    if (!best) return []
    return best.placed.slice().sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z).map((p, i) => ({ ...p, step: i }))
  }, [best])

  const n = boxesSorted.length
  useEffect(() => { setStep(n) }, [n])
  const visible = step >= n ? boxesSorted : boxesSorted.filter((p) => p.step < step)

  // uređivanje narudžbe
  const changeQty = (ci, id, d) => {
    setCustomers((prev) => {
      const next = cloneCust(prev)
      next[ci].qty[id] = Math.max(0, (next[ci].qty[id] || 0) + d)
      return next
    })
  }
  const loadExample = (x) => {
    setCustomers((prev) => prev.map((c, i) => ({ ...c, qty: EXAMPLES[x][i] ? mapQty(EXAMPLES[x][i], codeToId) : {} })))
  }

  const saveCurrentOrder = async () => {
    const suggested = `Utovar ${new Date().toLocaleDateString('hr-HR')}`
    const name = window.prompt('Naziv narudžbe:', suggested)
    if (!name) return
    try {
      await saveOrder({ name, vehicleId: vehicle.id, customers: active })
      flash('Narudžba spremljena ✓')
    } catch (e) { flash('Greška pri spremanju: ' + e.message) }
  }
  const openOrder = async (id) => {
    try {
      const ord = await loadOrder(id)
      const padded = [0, 1, 2].map((i) => ord.customers[i] || { name: DEFAULT_CUSTOMERS[i].name, color: DEFAULT_CUSTOMERS[i].color, qty: {} })
      setCustomers(padded)
      setNumCust(Math.min(3, Math.max(2, ord.customers.length)))
      setView('plan')
      flash(`Otvorena narudžba: ${ord.name}`)
    } catch (e) { flash('Greška pri otvaranju: ' + e.message) }
  }

  // ---- stanja učitavanja ----
  if (loading) return <div className="fullmsg">Učitavam podatke…</div>
  if (error) return <div className="fullmsg err">Greška pri spajanju na bazu:<br />{error}</div>
  if (!vehicle) return <div className="fullmsg">Nema definiranog kombija u bazi. Pokreni F2 SQL.</div>

  // ---- ekran: NARUDŽBE ----
  if (view === 'orders') {
    return <OrdersList onOpen={openOrder} onBack={() => setView('plan')} />
  }

  // ---- ekran: KATALOG ----
  if (view === 'catalog') {
    return (
      <div className="catalog-page">
        <div className="cathead">
          <button className="btn ghost" onClick={() => setView('plan')}>← Plan utovara</button>
          <h2>Katalog i kombi</h2>
        </div>
        <CatalogEditor products={productList} vehicle={vehicle} onChanged={refetchCatalog} />
      </div>
    )
  }

  // ---- statistika ----
  const vanVol = vehicle.L * vehicle.W * vehicle.H
  const usedVol = best ? best.placed.reduce((s, p) => s + p.dx * p.dy * p.dz, 0) : 0
  const util = (usedVol / vanVol) * 100
  const weight = best ? best.weight : 0
  const wPct = Math.min(100, (weight / vehicle.payload) * 100)
  const over = weight > vehicle.payload
  const maxY = best ? best.placed.reduce((m, p) => Math.max(m, p.y + p.dy), 0) : 0

  // ---- ekran: PLAN ----
  return (
    <div id="app">
      <div id="panel">
        <div className="panelhead">
          <h1>Utovar kombija</h1>
        </div>
        {notice && <div className="notice">{notice}</div>}
        <p className="sub">Auto-raspored · slaganje u vis · LIFO (istovar obrnut od utovara)</p>
        <div className="van-info">
          {vehicle.name} {vehicle.L.toFixed(1)} × {vehicle.W.toFixed(1)} × {vehicle.H.toFixed(2)} m · nosivost {vehicle.payload} kg · vrata straga · <b>Kupac 1 = uz kabinu</b>
        </div>
        <div className="toolbar">
          <button className="btn sm" onClick={saveCurrentOrder}>Spremi narudžbu</button>
          <button className="btn ghost sm" onClick={() => setView('orders')}>Narudžbe</button>
          <button className="btn ghost sm" onClick={() => setView('catalog')}>Katalog i kombi</button>
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
            {productList.map((p) => (
              <tr key={p.id}>
                <td className="prod">
                  <div className="pname">{p.name}</div>
                  <div className="pdim">{Math.round(p.l * 100)}×{Math.round(p.w * 100)}×{Math.round(p.h * 100)}cm · {p.weight}kg{p.canLie ? ' · liježe' : ''}</div>
                </td>
                {active.map((c, ci) => (
                  <td key={ci}>
                    <span className="mini">
                      <button onClick={() => changeQty(ci, p.id, -1)}>−</button>
                      <span>{c.qty[p.id] || 0}</span>
                      <button onClick={() => changeQty(ci, p.id, 1)}>+</button>
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="stats">
          <div>Iskorištenost prostora: <b>{util.toFixed(1)}%</b></div>
          <div className="bar"><div style={{ width: `${util.toFixed(0)}%`, background: '#2a6df4' }} /></div>
          <div>Težina: <b>{weight.toFixed(0)} / {vehicle.payload} kg</b></div>
          <div className="bar"><div style={{ width: `${wPct.toFixed(0)}%`, background: over ? '#c0392b' : '#1a8a4a' }} /></div>
          <div>Utovareno: <b>{n}</b> kom · najviši stup <b>{maxY.toFixed(2)} m</b></div>
          <div>Pomicanja pri istovaru: <b>{best ? best.up.moves : 0}</b></div>
          {best && best.unplaced.length
            ? <div className="warn">Nije stalo: {best.unplaced.length} kom ({best.unplaced.map((u) => u.name).join(', ')}).</div>
            : <div className="ok">✓ Sve stane.</div>}
          {over && <div className="warn">Prekoračena nosivost — makni nešto ili drugi kombi.</div>}
        </div>

        {best && (
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
        )}

        <div className="legend">
          <div className="legtitle">Kupci (utovar: kabina → vrata)</div>
          {active.map((c, ci) => {
            const items = best ? best.placed.filter((p) => p.custIdx === ci) : []
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
          <VanScene boxes={visible} van={vehicle} />
          <OrbitControls target={[0, vehicle.H / 2, 0]} enableDamping minDistance={2.5} maxDistance={18} />
        </Canvas>
        <div className="hint">Povuci = rotacija · dva prsta / kotačić = zoom</div>
      </div>
    </div>
  )
}
