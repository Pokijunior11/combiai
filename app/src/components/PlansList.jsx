import { useEffect, useState } from 'react'
import { listPlans, deletePlan } from '../lib/db'

export default function PlansList({ onOpen, onBack }) {
  const [plans, setPlans] = useState(null)
  const [err, setErr] = useState('')

  async function refresh() {
    setErr('')
    try { setPlans(await listPlans()) }
    catch (e) { setErr(e.message) }
  }
  useEffect(() => { refresh() }, [])

  const remove = async (p) => {
    if (!window.confirm(`Obrisati plan "${p.name}"?`)) return
    try { await deletePlan(p.id); await refresh() }
    catch (e) { setErr(e.message) }
  }

  return (
    <div className="catalog-page">
      <div className="cathead">
        <button className="btn ghost" onClick={onBack}>← Plan utovara</button>
        <h2>Spremljeni planovi</h2>
      </div>
      {err && <div className="warn">Greška: {err}</div>}
      {plans === null && <p>Učitavam…</p>}
      {plans && plans.length === 0 && <p className="hintline">Još nema spremljenih planova. Složi utovar i klikni „Spremi plan".</p>}
      {plans && plans.length > 0 && (
        <table className="ctable">
          <thead><tr><th className="prod">Naziv</th><th>Spremljeno</th><th></th></tr></thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td className="prod">{p.name}</td>
                <td>{new Date(p.created_at).toLocaleString('hr-HR')}</td>
                <td className="actions">
                  <button className="link" onClick={() => onOpen(p.id)}>otvori</button>
                  <button className="link del" onClick={() => remove(p)}>obriši</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
