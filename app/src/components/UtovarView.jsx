import { useEffect, useMemo, useState } from 'react'
import { loadOrder } from '../lib/db'
import { computeWithMust } from '../lib/mustFit'
import { readProgress, writeProgress } from '../lib/loadProgress'
import VanStage from './VanStage'
import ResultPanel from './ResultPanel'
import LoadMode from './LoadMode'

// Prikaz za skladištara: učita utovar, preračuna raspored, prikaže SAMO za gledanje.
// Dva ekrana (spec §4d): PREGLED (gotov utovar + velika tipka „Kreni utovar")
// → NAČIN UTOVARA (korak po korak, LoadMode).
export default function UtovarView({ id, products, vehicle, onBack }) {
  const [order, setOrder] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)   // jesmo li u načinu „korak po korak"

  useEffect(() => {
    let alive = true
    loadOrder(id).then((o) => { if (alive) setOrder(o) }).catch((e) => { if (alive) setErr(e.message) })
    return () => { alive = false }
  }, [id])

  // Tablet se ugasio nasred utovara → vrati ga RAVNO u utovar, ne na pregled.
  useEffect(() => {
    if (order && readProgress(id)?.active) setLoading(true)
  }, [order, id])

  const best = useMemo(() => {
    if (!order) return null
    return computeWithMust(order.customers, vehicle, products)
  }, [order, vehicle, products])

  if (err) return <div className="fullmsg err">Greška pri otvaranju:<br />{err}</div>
  if (!order || !best) return <div className="fullmsg">Učitavam…</div>

  if (loading) {
    return (
      <LoadMode
        orderId={id}
        title={order.name}
        best={best}
        van={vehicle}
        onExit={() => {
          // Prekid NE briše korak — vrati se na pregled, ali zapamti gdje je stao.
          writeProgress(id, { active: false, i: readProgress(id)?.i ?? 0 })
          setLoading(false)
        }}
      />
    )
  }

  const saved = readProgress(id)
  const resuming = saved && saved.i > 0

  return (
    <div id="app">
      <div id="panel">
        <div className="panelhead"><h1>{order.name}</h1></div>
        <div className="toolbar">
          <button className="btn ghost sm" onClick={onBack}>← Popis utovara</button>
        </div>

        <button className="btn-start" onClick={() => setLoading(true)}>
          ▶ {resuming ? `NASTAVI UTOVAR (korak ${saved.i + 1})` : 'KRENI UTOVAR'}
        </button>

        <ResultPanel best={best} vehicle={vehicle} customers={order.customers} />
      </div>
      <VanStage boxes={best.placed} van={vehicle} showSlider={false} />
    </div>
  )
}
