import { supabase } from './supabase'

// DB čuva cm/kg (brutto). Packer radi u metrima. Ovdje su pretvorbe.

// red iz baze (cm) -> artikl za packer/UI (m)
function rowToProduct(r) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    ean: r.ean,
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

// ---------- NARUDŽBE ----------
export async function listOrders() {
  const { data, error } = await supabase
    .from('orders').select('id,name,updated_at').order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

// customers: [{ name, color, qty: { [articleId]: n }, must: { [articleId]: n } }]
// must[articleId] = koliko komada MORA u kombi (0 = nije obavezno). Motor ga (za sad) ne forsira.
export async function saveOrder({ name, vehicleId, customers }) {
  const { data: ord, error: e1 } = await supabase
    .from('orders').insert({ name: name.trim(), vehicle_id: vehicleId }).select().single()
  if (e1) throw e1

  const custRows = customers.map((c, i) => ({ order_id: ord.id, name: c.name, color: c.color, position: i }))
  const { data: custs, error: e2 } = await supabase.from('order_customer').insert(custRows).select()
  if (e2) throw e2

  const items = []
  customers.forEach((c, i) => {
    const cust = custs.find((x) => x.position === i)
    for (const [articleId, qty] of Object.entries(c.qty || {})) {
      if (qty > 0) items.push({ order_customer_id: cust.id, article_id: articleId, qty, must_qty: Math.min(c.must?.[articleId] || 0, qty) })
    }
  })
  if (items.length) {
    const { error: e3 } = await supabase.from('order_item').insert(items)
    if (e3) throw e3
  }
  return ord.id
}

export async function loadOrder(id) {
  const { data: ord, error: e1 } = await supabase.from('orders').select('*').eq('id', id).single()
  if (e1) throw e1
  const { data: custs, error: e2 } = await supabase
    .from('order_customer').select('*').eq('order_id', id).order('position')
  if (e2) throw e2

  const custIds = custs.map((c) => c.id)
  let items = []
  if (custIds.length) {
    const { data, error: e3 } = await supabase.from('order_item').select('*').in('order_customer_id', custIds)
    if (e3) throw e3
    items = data
  }
  const customers = custs.map((c) => {
    const mine = items.filter((it) => it.order_customer_id === c.id)
    return {
      name: c.name,
      color: c.color,
      qty: Object.fromEntries(mine.map((it) => [it.article_id, it.qty])),
      must: Object.fromEntries(mine.map((it) => [it.article_id, it.must_qty || 0])),
    }
  })
  return { id: ord.id, name: ord.name, vehicleId: ord.vehicle_id, customers }
}

export async function updateOrder(id, { name, vehicleId, customers }) {
  const { error: e0 } = await supabase.from('orders')
    .update({ name: name.trim(), vehicle_id: vehicleId, updated_at: new Date().toISOString() }).eq('id', id)
  if (e0) throw e0
  // zamijeni kupce/stavke (cascade briše stare stavke)
  const { error: e1 } = await supabase.from('order_customer').delete().eq('order_id', id)
  if (e1) throw e1
  const custRows = customers.map((c, i) => ({ order_id: id, name: c.name, color: c.color, position: i }))
  const { data: custs, error: e2 } = await supabase.from('order_customer').insert(custRows).select()
  if (e2) throw e2
  const items = []
  customers.forEach((c, i) => {
    const cust = custs.find((x) => x.position === i)
    for (const [articleId, qty] of Object.entries(c.qty || {})) {
      if (qty > 0) items.push({ order_customer_id: cust.id, article_id: articleId, qty, must_qty: Math.min(c.must?.[articleId] || 0, qty) })
    }
  })
  if (items.length) {
    const { error: e3 } = await supabase.from('order_item').insert(items)
    if (e3) throw e3
  }
}

export async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}

// ---------- PLANOVI (zamrznuti izračun za skladištara) ----------
export async function savePlan({ name, orderId, data }) {
  const { data: row, error } = await supabase
    .from('plan').insert({ name: name.trim(), order_id: orderId || null, data }).select('id').single()
  if (error) throw error
  return row.id
}
export async function listPlans() {
  const { data, error } = await supabase
    .from('plan').select('id,name,created_at').order('created_at', { ascending: false })
  if (error) throw error
  return data
}
export async function loadPlan(id) {
  const { data, error } = await supabase.from('plan').select('*').eq('id', id).single()
  if (error) throw error
  return data
}
export async function deletePlan(id) {
  const { error } = await supabase.from('plan').delete().eq('id', id)
  if (error) throw error
}
