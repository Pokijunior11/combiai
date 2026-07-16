import { useMemo, useState, useEffect } from 'react'
import { computeBest } from './lib/packer'
import { fetchArticles, fetchVehicle, saveOrder, updateOrder, loadOrder } from './lib/db'
import CatalogEditor from './components/CatalogEditor'
import HomeList from './components/HomeList'
import UtovarView from './components/UtovarView'
import OtpremnicaImport from './components/OtpremnicaImport'
import VanStage from './components/VanStage'
import ResultPanel from './components/ResultPanel'
import './App.css'

// Boje kupaca (ciklički). Kupac 1 = uz kabinu (prvi utovaren).
const PALETTE = ['#e0783f', '#2f7dd1', '#4fa06a', '#b5539c', '#c9a227', '#3fb0b0', '#9c6b3f', '#7a5cd0']

const labelOf = (p, fallback) => (p ? (p.code ? `Heinner ${p.code}` : p.name) : fallback)
const dimOf = (p) => (p ? `${Math.round(p.l * 100)}×${Math.round(p.w * 100)}×${Math.round(p.h * 100)}cm · ${p.weight}kg${p.canLie ? ' · liježe' : ''}` : null)

// Utovar (blokovi kupaca) → ulaz za packer/spremanje: [{ name, color, qty: { [articleId]: n } }] (samo matchane stavke).
const toPackCustomers = (blocks) =>
  blocks.map((b) => ({
    name: b.name,
    color: b.color,
    qty: Object.fromEntries(b.items.filter((i) => i.matched && i.qty > 0).map((i) => [i.articleId, i.qty])),
  }))

// Spremljeni utovar → blokovi (za uređivanje). qty:{articleId:n} + katalog → stavke.
const orderToBlocks = (customers, productsById) =>
  customers.map((c, i) => ({
    name: c.name,
    color: c.color || PALETTE[i % PALETTE.length],
    docs: [],
    items: Object.entries(c.qty || {}).map(([articleId, qty]) => {
      const p = productsById[articleId]
      return { key: `a:${articleId}`, articleId, ean: p?.ean, label: labelOf(p, articleId), dim: dimOf(p), qty, priority: false, matched: !!p }
    }),
  }))

export default function App() {
  const [productList, setProductList] = useState([])
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const flash = (m) => { setNotice(m); setTimeout(() => setNotice(''), 3000) }

  const [view, setView] = useState('home') // 'home' | 'edit' | 'view' | 'catalog'
  const [viewId, setViewId] = useState(null)  // utovar koji skladištar gleda
  const [editId, setEditId] = useState(null)  // utovar koji planer uređuje (null = novi)
  const [editName, setEditName] = useState('')
  const [blocks, setBlocks] = useState([])    // kupci s uvezenim/uređenim stavkama

  const productsById = useMemo(() => Object.fromEntries(productList.map((p) => [p.id, p])), [productList])

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

  const packCustomers = useMemo(() => toPackCustomers(blocks), [blocks])
  const best = useMemo(() => {
    if (!vehicle || productList.length === 0 || blocks.length === 0) return null
    return computeBest(packCustomers, vehicle, productsById)
  }, [packCustomers, vehicle, productsById, productList.length, blocks.length])

  // ---- navigacija ----
  const goNew = () => { setBlocks([]); setEditId(null); setEditName(''); setView('edit') }
  const goEdit = async (id) => {
    try {
      const ord = await loadOrder(id)
      setBlocks(orderToBlocks(ord.customers, productsById))
      setEditId(id); setEditName(ord.name); setView('edit')
    } catch (e) { flash('Greška pri otvaranju: ' + e.message) }
  }
  const goView = (id) => { setViewId(id); setView('view') }

  const saveUtovar = async () => {
    if (blocks.length === 0) { flash('Nema kupaca — uvezi otpremnicu.'); return }
    const suggested = editName || `Utovar ${new Date().toLocaleDateString('hr-HR')}`
    const name = window.prompt('Naziv utovara:', suggested)
    if (!name) return
    try {
      if (editId) await updateOrder(editId, { name, vehicleId: vehicle.id, customers: packCustomers })
      else await saveOrder({ name, vehicleId: vehicle.id, customers: packCustomers })
      flash('Utovar spremljen ✓')
      setView('home')
    } catch (e) { flash('Greška pri spremanju: ' + e.message) }
  }

  // ---- uvoz otpremnice: akumuliraj po kupcu (isti naziv → dopuni stavke) ----
  const onImport = (matched, fileName) => {
    const docNos = String(matched.docNo || '').split(',').map((s) => s.trim()).filter(Boolean)
    setBlocks((prev) => {
      const next = prev.map((b) => ({ ...b, docs: [...b.docs], items: b.items.map((i) => ({ ...i })) }))
      for (const c of matched.customers) {
        let block = next.find((b) => b.name === c.name)
        if (!block) { block = { name: c.name, color: PALETTE[next.length % PALETTE.length], docs: [], items: [] }; next.push(block) }
        for (const d of docNos) if (!block.docs.includes(d)) block.docs.push(d)
        for (const it of c.items) {
          const key = it.article ? `a:${it.article.id}` : `e:${it.ean || it.rawName}`
          const existing = block.items.find((x) => x.key === key)
          if (existing) existing.qty += it.qty
          else block.items.push({
            key, articleId: it.article?.id || null, ean: it.ean,
            label: labelOf(it.article, it.rawName), dim: dimOf(it.article),
            qty: it.qty, priority: false, matched: !!it.article,
          })
        }
      }
      return next
    })
    const s = matched.stats
    flash(`Uvezeno "${matched.docNo || fileName}": ${s.matched} u katalogu${s.unmatched ? `, ${s.unmatched} nepoznato` : ''}`)
  }

  // ---- uređivanje blokova ----
  const changeQty = (bi, key, d) => setBlocks((prev) => prev.map((b, i) => i !== bi ? b
    : { ...b, items: b.items.map((it) => it.key !== key ? it : { ...it, qty: Math.max(0, it.qty + d) }) }))
  const removeItem = (bi, key) => setBlocks((prev) => prev.map((b, i) => i !== bi ? b
    : { ...b, items: b.items.filter((it) => it.key !== key) }))
  const togglePrio = (bi, key) => setBlocks((prev) => prev.map((b, i) => i !== bi ? b
    : { ...b, items: b.items.map((it) => it.key !== key ? it : { ...it, priority: !it.priority }) }))
  const removeCust = (bi) => setBlocks((prev) => prev.filter((_, i) => i !== bi))

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
  const totalUnits = blocks.reduce((n, b) => n + b.items.reduce((m, it) => m + it.qty, 0), 0)
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

        <OtpremnicaImport products={productList} onImport={onImport} />

        {blocks.length === 0 ? (
          <div className="empty-hint">
            Uvezi otpremnicu (.xls) za početak.<br />
            Jedna otpremnica = jedan kupac; svaki idući upload se slaže po kupcima ispod.
          </div>
        ) : (
          <div className="blocks">
            {blocks.map((b, bi) => (
              <div key={bi} className="cb">
                <div className="cb-head">
                  <span className="dot" style={{ background: b.color }} />
                  <span className="cb-name">{bi + 1}. {b.name}</span>
                  {b.docs.length > 0 && <span className="cb-doc" title="broj otpremnice">otpr. {b.docs.join(', ')}</span>}
                  <button className="link danger" onClick={() => removeCust(bi)}>ukloni</button>
                </div>
                {b.items.length === 0 && <div className="cb-none">nema stavki</div>}
                {[...b.items].sort((a, c) => (c.priority ? 1 : 0) - (a.priority ? 1 : 0)).map((it) => (
                  <div key={it.key} className={'cb-item' + (it.matched ? '' : ' miss') + (it.priority ? ' prio' : '')}>
                    <button className={'star' + (it.priority ? ' on' : '')} title="prioritet (mora u kombi)" onClick={() => togglePrio(bi, it.key)}>★</button>
                    <div className="cb-main">
                      <div className="cb-label">{it.label}{!it.matched && <span className="itag">nije u katalogu</span>}</div>
                      <div className="cb-dim">{it.dim || (it.ean ? `EAN ${it.ean}` : '')}</div>
                    </div>
                    <span className="mini">
                      <button onClick={() => changeQty(bi, it.key, -1)}>−</button>
                      <span>{it.qty}</span>
                      <button onClick={() => changeQty(bi, it.key, 1)}>+</button>
                    </span>
                    <button className="cb-del" title="makni artikl" onClick={() => removeItem(bi, it.key)}>✕</button>
                  </div>
                ))}
              </div>
            ))}
            <div className="blocks-sum">{blocks.length} {blocks.length === 1 ? 'kupac' : 'kupaca'} · {totalUnits} kom</div>
          </div>
        )}

        {best && <ResultPanel best={best} vehicle={vehicle} customers={packCustomers} />}
      </div>

      {best && <VanStage boxes={best.placed} van={vehicle} />}
    </div>
  )
}
