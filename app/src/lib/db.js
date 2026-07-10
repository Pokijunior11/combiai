import { supabase } from './supabase'

// DB čuva cm/kg (brutto). Packer radi u metrima. Ovdje su pretvorbe.

// red iz baze (cm) -> artikl za packer/UI (m)
function rowToProduct(r) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    l: Number(r.length_cm) / 100,
    w: Number(r.width_cm) / 100,
    h: Number(r.height_cm) / 100,
    weight: Number(r.weight_kg),
    canLie: r.can_lie,
  }
}

// form (cm) -> red za bazu
function formToRow(f) {
  return {
    code: f.code?.trim() ? f.code.trim() : null,
    name: f.name.trim(),
    length_cm: Number(f.length_cm),
    width_cm: Number(f.width_cm),
    height_cm: Number(f.height_cm),
    weight_kg: Number(f.weight_kg),
    can_lie: !!f.can_lie,
  }
}

// ---------- ARTIKLI ----------
export async function fetchArticles() {
  const { data, error } = await supabase.from('article').select('*').order('name')
  if (error) throw error
  return data.map(rowToProduct)
}
export async function createArticle(form) {
  const { data, error } = await supabase.from('article').insert(formToRow(form)).select().single()
  if (error) throw error
  return rowToProduct(data)
}
export async function updateArticle(id, form) {
  const { data, error } = await supabase.from('article').update(formToRow(form)).eq('id', id).select().single()
  if (error) throw error
  return rowToProduct(data)
}
export async function deleteArticle(id) {
  const { error } = await supabase.from('article').delete().eq('id', id)
  if (error) throw error
}

// ---------- VOZILO (jedan kombi u V1) ----------
export async function fetchVehicle() {
  const { data, error } = await supabase.from('vehicle').select('*').order('created_at').limit(1)
  if (error) throw error
  const v = data[0]
  if (!v) return null
  return {
    id: v.id,
    name: v.name,
    L: Number(v.length_cm) / 100,
    W: Number(v.width_cm) / 100,
    H: Number(v.height_cm) / 100,
    payload: Number(v.payload_kg),
  }
}
export async function updateVehicle(id, form) {
  const { error } = await supabase.from('vehicle').update({
    name: form.name.trim(),
    length_cm: Number(form.length_cm),
    width_cm: Number(form.width_cm),
    height_cm: Number(form.height_cm),
    payload_kg: Number(form.payload_kg),
  }).eq('id', id)
  if (error) throw error
}
