// Statistika + plan istovara + legenda. Koriste ga i planer i skladištar.
export default function ResultPanel({ best, vehicle, customers }) {
  const vanVol = vehicle.L * vehicle.W * vehicle.H
  const usedVol = best.placed.reduce((s, p) => s + p.dx * p.dy * p.dz, 0)
  const util = (usedVol / vanVol) * 100
  const weight = best.weight
  const wPct = Math.min(100, (weight / vehicle.payload) * 100)
  const over = weight > vehicle.payload
  const maxY = best.placed.reduce((m, p) => Math.max(m, p.y + p.dy), 0)
  const n = best.placed.length
  const dropped = best.dropped || []                       // neobavezno izbačeno da obavezno stane
  const mustFits = best.mustFits !== false                 // stanu li sva „mora u kombi"
  const nothingLeftOut = dropped.length === 0 && best.unplaced.length === 0

  return (
    <>
      <div className="stats">
        <div>Iskorištenost prostora: <b>{util.toFixed(1)}%</b></div>
        <div className="bar"><div style={{ width: `${util.toFixed(0)}%`, background: '#2a6df4' }} /></div>
        <div>Težina: <b>{weight.toFixed(0)} / {vehicle.payload} kg</b></div>
        <div className="bar"><div style={{ width: `${wPct.toFixed(0)}%`, background: over ? '#c0392b' : '#1a8a4a' }} /></div>
        <div>Utovareno: <b>{n}</b> kom · najviši stup <b>{maxY.toFixed(2)} m</b></div>
        <div>Pomicanja pri istovaru: <b>{best.up.moves}</b></div>
        {!mustFits && (
          <div className="warn">⚠ Ne stane ni sve <b>obavezno</b> — {best.mustShort} kom obaveznog ne stane. Smanji količine ili obavezne stavke.</div>
        )}
        {dropped.length > 0 && (
          <div className="warn">Izbačeno (neobavezno) da obavezno stane: {dropped.map((d) => `${d.name}×${d.count}`).join(', ')}.</div>
        )}
        {best.unplaced.length > 0 && (
          <div className="warn">Nije stalo (neobavezno): {best.unplaced.length} kom ({best.unplaced.map((u) => u.name).join(', ')}).</div>
        )}
        {mustFits && nothingLeftOut && <div className="ok">✓ Sve stane.</div>}
        {over && <div className="warn">Prekoračena nosivost — makni nešto ili drugi kombi.</div>}
      </div>

      <div className="order">
        <h4>Plan istovara (redom rute)</h4>
        {best.up.steps.map((s, i) => (
          <div className="ustep" key={i}>
            <b>{i + 1}. {s.name}</b> · {s.count} kom
            {s.blockers.length
              ? <div className="move">↳ prvo pomakni: {s.blockers.map((b) => `${b.name} (${b.custName})`).join(', ')}</div>
              : <div className="okline">↳ slobodan pristup</div>}
          </div>
        ))}
      </div>

      <div className="legend">
        <div className="legtitle">Kupci (utovar: kabina → vrata)</div>
        {customers.map((c, ci) => {
          const items = best.placed.filter((p) => p.custIdx === ci)
          const w = items.reduce((s, p) => s + p.weight, 0)
          return (
            <div className="legrow" key={ci}>
              <span className="sw" style={{ background: c.color }} /> {ci + 1}. {c.name} · {items.length} kom · {w.toFixed(0)} kg
            </div>
          )
        })}
      </div>
    </>
  )
}
