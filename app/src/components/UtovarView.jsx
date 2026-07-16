import { useEffect, useMemo, useState } from 'react'
import { loadOrder } from '../lib/db'
import { computeWithMust } from '../lib/mustFit'
import VanStage from './VanStage'
import ResultPanel from './ResultPanel'

// Prikaz za skladištara: učita utovar, preračuna raspored, prikaže SAMO za gledanje.
export default function UtovarView({ id, products, vehicle, onBack }) {
  const [order, setOrder] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    loadOrder(id).then((o) => { if (alive) setOrder(o) }).catch((e) => { if (alive) setErr(e.message) })
    return () => { alive = false }
  }, [id])

  const best = useMemo(() => {
    if (!order) return null
    return computeWithMust(order.customers, vehicle, products)
  }, [order, vehicle, products])

  if (err) return <div className="fullmsg err">Greška pri otvaranju:<br />{err}</div>
  if (!order || !best) return <div className="fullmsg">Učitavam…</div>

  return (
    <div id="app">
      <div id="panel">
        <div className="panelhead"><h1>{order.name}</h1></div>
        <div className="toolbar">
          <button className="btn ghost sm" onClick={onBack}>← Popis utovara</button>
        </div>
        <div className="van-info">
          {vehicle.name} {vehicle.L.toFixed(1)} × {vehicle.W.toFixed(1)} × {vehicle.H.toFixed(2)} m · nosivost {vehicle.payload} kg · vrata straga
        </div>
        <ResultPanel best={best} vehicle={vehicle} customers={order.customers} />
      </div>
      <VanStage boxes={best.placed} van={vehicle} />
    </div>
  )
}
