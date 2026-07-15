import { useRef, useState } from 'react'
import { parseOtpremnica, matchToCatalog } from '../lib/importOtpremnica'

// Boje za uvezene kupce (ciklički). Kupac 1 = uz kabinu.
const PALETTE = ['#e0783f', '#2f7dd1', '#4fa06a', '#b5539c', '#c9a227', '#3fb0b0', '#9c6b3f', '#7a5cd0']

// Panel za uvoz Synesis otpremnice: učitaj .xls → parse → match po EAN → pregled.
// „Primijeni na utovar" pošalje MATCHANE stavke u editor (qty model). Nematchane su samo prikazane.
export default function OtpremnicaImport({ products, onApply }) {
  const fileRef = useRef(null)
  const [result, setResult] = useState(null) // { docNo, customers, stats }
  const [err, setErr] = useState('')

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(''); setResult(null)
    try {
      const buf = await file.arrayBuffer()
      const matched = matchToCatalog(parseOtpremnica(buf), products)
      setResult(matched)
    } catch (ex) {
      setErr(ex.message || String(ex))
    } finally {
      if (fileRef.current) fileRef.current.value = '' // dozvoli ponovni odabir iste datoteke
    }
  }

  function apply() {
    // Matchane stavke → editorov model: [{ name, color, qty: { [articleId]: n } }]
    const customers = result.customers.map((c, i) => {
      const qty = {}
      for (const it of c.items) {
        if (it.article) qty[it.article.id] = (qty[it.article.id] || 0) + it.qty
      }
      return { name: c.name, color: PALETTE[i % PALETTE.length], qty }
    })
    onApply(customers, result.stats)
  }

  return (
    <div className="import">
      <input ref={fileRef} type="file" accept=".xls,.xlsx" onChange={onFile} style={{ display: 'none' }} />
      <button className="btn ghost sm" onClick={() => fileRef.current?.click()}>⬆ Uvezi otpremnicu (.xls)</button>

      {err && <div className="import-err">{err}</div>}

      {result && (
        <div className="import-review">
          <div className="import-head">
            Otpremnica {result.docNo || '—'} · {result.stats.matched + result.stats.unmatched} stavki ·{' '}
            <b>{result.stats.matched}</b> u katalogu, <b>{result.stats.unmatched}</b> nepoznato
          </div>
          {result.customers.map((c, i) => (
            <div key={i} className="import-cust">
              <div className="import-cust-name">
                <span className="dot" style={{ background: PALETTE[i % PALETTE.length] }} />
                {i + 1}. {c.name}
              </div>
              <ul className="import-items">
                {c.items.map((it, j) => (
                  <li key={j} className={it.article ? 'ok' : 'miss'}>
                    <span className="mark">{it.article ? '✓' : '✗'}</span>
                    <span className="iname">{it.article ? (it.article.code ? `Heinner ${it.article.code}` : it.article.name) : it.rawName}</span>
                    <span className="iqty">×{it.qty}</span>
                    {!it.article && <span className="itag">nije u katalogu{it.ean ? ` (${it.ean})` : ''}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <button className="btn" onClick={apply}>
            Primijeni na utovar ({result.stats.matched} {result.stats.matched === 1 ? 'artikl' : 'artikala'})
          </button>
          {result.stats.unmatched > 0 && (
            <div className="import-note">
              Nematchane stavke ({result.stats.unmatched}) se ne prenose — dodaj ih ručno u katalog ili u utovar.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
