import { useMemo, useState, useEffect } from 'react'
import { DEFAULT_CUSTOMERS, EXAMPLES } from './data/catalog'
import { computeBest } from './lib/packer'
import { fetchArticles, fetchVehicle, saveOrder, updateOrder, loadOrder } from './lib/db'
import CatalogEditor from './components/CatalogEditor'
import HomeList from './components/HomeList'
import UtovarView from './components/UtovarView'
import VanStage from './components/VanStage'
import ResultPanel from './components/ResultPanel'
import './App.css'

const cloneCust = (c) => c.map((x) => ({ ...x, qty: { ...x.qty } }))
const mapQty = (codeQty, codeToId) => {
  const out = {}
  for (const [code, n] of Object.entries(codeQty || {})) {
    const id = codeToId[code]
    if (id) out[id] = n
  }
  return out
}
const emptyCustomers = () => DEFAULT_CUSTOMERS.map((c) => ({ name: c.name, color: c.color, qty: {} }))

export default function App() {
  const [productList, setProductList] = useState([])
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 2500) }

  const [view, setView] = useState('home') // 'home' | 'edit' | 'view' | 'catalog'
  const [viewId, setViewId] = useState(null)   // utovar koji skladištar gleda
  const [editId, setEditId] = useState(null)   // utovar koji planer uređuje (null = novi)
  const [editName, setEditName] = useState('')
  const [customers, setCustomers] = useState(emptyCustomers())
  const [numCust, setNumCust] = useState(3)

  const productsById = useMemo(() => Object.fromEntries(productList.map((p) => [p.id, p])), [productList])
  const codeToId = useMemo(() => Object.fromEntries(productList.filter((p) => p.code).map((p) => [p.code, p.id])), [productList])

  async function initialLoad() {
    setLoading(true); setError('')
    try {
      const [arts, veh] = await Promise.all([fetchArticles(), fetchVehicle()])
      setProductList(arts)
      setVehicle(veh)
    } catch (e) { setError(e.message || String(e)) } finally { setLoading(false) }
  }
  async function refetchCatalog() {
    const [arts, veh] = await Promise.all([fetchArticles(), fetchVehicle()])
    setProductList(arts); setVehicle(veh)
  }
  useEffect(() => { initialLoad() }, [])

  const active = customers.slice(0, numCust)
  const best = useMemo(() => {
    if (!vehicle || productList.length === 0) return null
    return computeBest(active, vehicle, productsById)
  }, [customers, numCust, vehicle, productsById])

  // ---- navigacija ----
  const goNew = () => {
    setCustomers(emptyCustomers()); setNumCust(3); setEditId(null); setEditName(''); setView('edit')
  }
  const goEdit = async (id) => {
    try {
      const ord = await loadOrder(id)
      const padded = [0, 1, 2].map((i) => ord.customers[i] || { name: DEFAULT_CUSTOMERS[i].name, color: DEFAULT_CUSTOMERS[i].color, qty: {} })
      setCustomers(padded); setNumCust(Math.min(3, Math.max(2, ord.customers.length)))
      setEditId(id); setEditName(ord.name); setView('edit')
    } catch (e) { flash('Greška pri otvaranju: ' + e.message) }
  }
  const goView = (id) => { setViewId(id); setView('view') }

  const saveUtovar = async () => {
    const suggested = editName || `Utovar ${new Date().toLocaleDateString('hr-HR')}`
    const name = window.prompt('Naziv utovara:', suggested)
    if (!name) return
    try {
      if (editId) await updateOrder(editId, { name, vehicleId: vehicle.id, customers: active })
      else await saveOrder({ name, vehicleId: vehicle.id, customers: active })
      flash('Utovar spremljen ✓')
      setView('home')
    } catch (e) { flash('Greška pri spremanju: ' + e.message) }
  }

  // ---- uređivanje ----
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

  // ---- stanja ----
  if (loading) return <div className="fullmsg">Učitavam podatke…</div>
  if (error) return <div className="fullmsg err">Greška pri spajanju na bazu:<br />{error}</div>
  if (!vehicle) return <div className="fullmsg">Nema definiranog kombija u bazi. Pokreni SQL iz mape supabase/.</div>

  // ---- ekran: SKLADIŠTAR (samo gledanje) ----
  if (view === 'view') {
    return <UtovarView id={viewId} products={productsById} vehicle={vehicle} onBack={() => setView('home')} />
  }

  // ---- ekran: KATALOG ----
  if (view === 'catalog') {
    return (
      <div className="catalog-page">
        <div className="cathead">
          <button className="btn ghost" onClick={() => setView('edit')}>← Natrag</button>
          <h2>Katalog i kombi</h2>
        </div>
        <CatalogEditor products={productList} vehicle={vehicle} onChanged={refetchCatalog} />
      </div>
    )
  }

  // ---- ekran: POČETNI POPIS ----
  if (view === 'home') {
    return <HomeList onView={goView} onEdit={goEdit} onNew={goNew} />
  }

  // ---- ekran: PLANER (uređivanje) ----
  return (
    <div id="app">
      <div id="panel">
        <div className="panelhead"><h1>{editId ? 'Uredi utovar' : 'Novi utovar'}</h1></div>
        {notice && <div className="notice">{notice}</div>}
        <div className="toolbar">
          <button className="btn" onClick={saveUtovar}>Spremi utovar</button>
          <button className="btn ghost sm" onClick={() => setView('home')}>← Popis</button>
          <button className="btn ghost sm" onClick={() => setView('catalog')}>Katalog i kombi</button>
        </div>
        <div className="van-info">
          {vehicle.name} {vehicle.L.toFixed(1)} × {vehicle.W.toFixed(1)} × {vehicle.H.toFixed(2)} m · nosivost {vehicle.payload} kg · vrata straga · <b>Kupac 1 = uz kabinu</b>
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
                  <div className="pname">{p.ean ? `Heinner ${p.code}` : p.name}</div>
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

        {best && <ResultPanel best={best} vehicle={vehicle} customers={active} />}
      </div>

      {best && <VanStage boxes={best.placed} van={vehicle} />}
    </div>
  )
}
