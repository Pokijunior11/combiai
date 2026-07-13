import { useEffect, useState } from 'react'
import { listOrders, deleteOrder } from '../lib/db'

// Početni ekran: popis spremljenih utovara (najnoviji gore). Skladištar klikne „Otvori".
export default function HomeList({ onView, onEdit, onNew }) {
  const [items, setItems] = useState(null)
  const [err, setErr] = useState('')

  async function refresh() {
    setErr('')
    try { setItems(await listOrders()) } catch (e) { setErr(e.message) }
  }
  useEffect(() => { refresh() }, [])

  const remove = async (o) => {
    if (!window.confirm(`Obrisati utovar "${o.name}"?`)) return
    try { await deleteOrder(o.id); await refresh() } catch (e) { setErr(e.message) }
  }

  return (
    <div className="home">
      <div className="homehead">
        <h1>Utovari</h1>
        <button className="btn" onClick={onNew}>+ Planiraj novi utovar</button>
      </div>
      <button className="btn ghost sm refreshbtn" onClick={refresh}>↻ Osvježi</button>
      {err && <div className="warn">Greška: {err}</div>}
      {items === null && <p>Učitavam…</p>}
      {items && items.length === 0 && <p className="hintline">Još nema utovara. Klikni „+ Planiraj novi utovar".</p>}
      {items && items.map((o) => (
        <div className="homerow" key={o.id}>
          <div className="homerow-main" onClick={() => onView(o.id)}>
            <div className="homerow-name">{o.name}</div>
            <div className="homerow-date">{new Date(o.updated_at).toLocaleString('hr-HR')}</div>
          </div>
          <div className="homerow-actions">
            <button className="btn sm" onClick={() => onView(o.id)}>Otvori</button>
            <button className="link" onClick={() => onEdit(o.id)}>uredi</button>
            <button className="link del" onClick={() => remove(o)}>obriši</button>
          </div>
        </div>
      ))}
    </div>
  )
}
