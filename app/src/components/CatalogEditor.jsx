import { useState, useEffect } from 'react'
import { createArticle, updateArticle, deleteArticle, updateVehicle } from '../lib/db'

const emptyForm = { name: '', code: '', length_cm: 60, width_cm: 60, height_cm: 85, weight_kg: 50, can_lie: false }

export default function CatalogEditor({ products, vehicle, onChanged }) {
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [vForm, setVForm] = useState(null)

  useEffect(() => {
    if (vehicle) setVForm({
      name: vehicle.name,
      length_cm: Math.round(vehicle.L * 100),
      width_cm: Math.round(vehicle.W * 100),
      height_cm: Math.round(vehicle.H * 100),
      payload_kg: vehicle.payload,
    })
  }, [vehicle])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setV = (k, v) => setVForm((f) => ({ ...f, [k]: v }))

  const startNew = () => { setEditingId(null); setForm(emptyForm) }
  const startEdit = (p) => {
    setEditingId(p.id)
    setForm({
      name: p.name, code: p.code || '',
      length_cm: Math.round(p.l * 100), width_cm: Math.round(p.w * 100),
      height_cm: Math.round(p.h * 100), weight_kg: p.weight, can_lie: p.canLie,
    })
  }

  const saveArticle = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      if (editingId) await updateArticle(editingId, form)
      else await createArticle(form)
      await onChanged(); startNew()
    } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }
  const removeArticle = async (p) => {
    if (!window.confirm(`Obrisati "${p.name}"?`)) return
    setBusy(true); setErr('')
    try { await deleteArticle(p.id); await onChanged(); if (editingId === p.id) startNew() }
    catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }
  const saveVehicle = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await updateVehicle(vehicle.id, vForm); await onChanged() }
    catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }

  return (
    <div className="catalog">
      {err && <div className="warn">Greška: {err}</div>}

      <h3>Kombi</h3>
      {vForm && (
        <form className="cform" onSubmit={saveVehicle}>
          <label>Naziv<input value={vForm.name} onChange={(e) => setV('name', e.target.value)} required /></label>
          <div className="frow">
            <label>Duljina (cm)<input type="number" value={vForm.length_cm} onChange={(e) => setV('length_cm', e.target.value)} required /></label>
            <label>Širina (cm)<input type="number" value={vForm.width_cm} onChange={(e) => setV('width_cm', e.target.value)} required /></label>
            <label>Visina (cm)<input type="number" value={vForm.height_cm} onChange={(e) => setV('height_cm', e.target.value)} required /></label>
            <label>Nosivost (kg)<input type="number" value={vForm.payload_kg} onChange={(e) => setV('payload_kg', e.target.value)} required /></label>
          </div>
          <button className="btn" disabled={busy}>Spremi kombi</button>
        </form>
      )}

      <h3>Katalog artikala ({products.length})</h3>
      <table className="ctable">
        <thead>
          <tr><th className="prod">Artikl</th><th>D×Š×V (cm)</th><th>kg</th><th>liježe</th><th></th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={editingId === p.id ? 'editing' : ''}>
              <td className="prod">{p.name}{p.code ? <span className="pdim"> · {p.code}</span> : ''}</td>
              <td>{Math.round(p.l * 100)}×{Math.round(p.w * 100)}×{Math.round(p.h * 100)}</td>
              <td>{p.weight}</td>
              <td>{p.canLie ? 'da' : '–'}</td>
              <td className="actions">
                <button className="link" onClick={() => startEdit(p)}>uredi</button>
                <button className="link del" onClick={() => removeArticle(p)}>obriši</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>{editingId ? 'Uredi artikl' : 'Novi artikl'}</h3>
      <form className="cform" onSubmit={saveArticle}>
        <div className="frow">
          <label className="grow">Naziv<input value={form.name} onChange={(e) => set('name', e.target.value)} required /></label>
          <label>Šifra<input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="opcionalno" /></label>
        </div>
        <div className="frow">
          <label>Duljina (cm)<input type="number" value={form.length_cm} onChange={(e) => set('length_cm', e.target.value)} required /></label>
          <label>Širina (cm)<input type="number" value={form.width_cm} onChange={(e) => set('width_cm', e.target.value)} required /></label>
          <label>Visina (cm)<input type="number" value={form.height_cm} onChange={(e) => set('height_cm', e.target.value)} required /></label>
          <label>Težina (kg)<input type="number" value={form.weight_kg} onChange={(e) => set('weight_kg', e.target.value)} required /></label>
        </div>
        <label className="check"><input type="checkbox" checked={form.can_lie} onChange={(e) => set('can_lie', e.target.checked)} /> smije se položiti (npr. mali frižider)</label>
        <div className="frow">
          <button className="btn" disabled={busy}>{editingId ? 'Spremi izmjene' : 'Dodaj artikl'}</button>
          {editingId && <button type="button" className="btn ghost" onClick={startNew}>Odustani</button>}
        </div>
        <p className="hintline">Dimenzije su <b>brutto</b> (zapakirano), u centimetrima.</p>
      </form>
    </div>
  )
}
