import { useEffect, useState } from 'react'
import { listOrders, deleteOrder } from '../lib/db'

export default function OrdersList({ onOpen, onBack }) {
  const [orders, setOrders] = useState(null)
  const [err, setErr] = useState('')

  async function refresh() {
    setErr('')
    try { setOrders(await listOrders()) }
    catch (e) { setErr(e.message) }
  }
  useEffect(() => { refresh() }, [])

  const remove = async (o) => {
    if (!window.confirm(`Obrisati narudžbu "${o.name}"?`)) return
    try { await deleteOrder(o.id); await refresh() }
    catch (e) { setErr(e.message) }
  }

  return (
    <div className="catalog-page">
      <div className="cathead">
        <button className="btn ghost" onClick={onBack}>← Plan utovara</button>
        <h2>Spremljene narudžbe</h2>
      </div>
      {err && <div className="warn">Greška: {err}</div>}
      {orders === null && <p>Učitavam…</p>}
      {orders && orders.length === 0 && <p className="hintline">Još nema spremljenih narudžbi. Složi robu i klikni „Spremi narudžbu".</p>}
      {orders && orders.length > 0 && (
        <table className="ctable">
          <thead><tr><th className="prod">Naziv</th><th>Zadnja izmjena</th><th></th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="prod">{o.name}</td>
                <td>{new Date(o.updated_at).toLocaleString('hr-HR')}</td>
                <td className="actions">
                  <button className="link" onClick={() => onOpen(o.id)}>otvori</button>
                  <button className="link del" onClick={() => remove(o)}>obriši</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
