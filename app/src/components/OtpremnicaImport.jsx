import { useRef, useState } from 'react'
import { parseOtpremnica, matchToCatalog } from '../lib/importOtpremnica'

// Gumb za uvoz Synesis otpremnice (.xls/.xlsx). Jedna otpremnica = jedan kupac.
// Parsira + matcha po EAN i zove onImport(result, fileName); akumulaciju radi roditelj (App).
export default function OtpremnicaImport({ products, onImport }) {
  const fileRef = useRef(null)
  const [err, setErr] = useState('')

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr('')
    try {
      const buf = await file.arrayBuffer()
      onImport(matchToCatalog(parseOtpremnica(buf), products), file.name)
    } catch (ex) {
      setErr(ex.message || String(ex))
    } finally {
      if (fileRef.current) fileRef.current.value = '' // dozvoli ponovni odabir iste datoteke
    }
  }

  return (
    <div className="import">
      <input ref={fileRef} type="file" accept=".xls,.xlsx" onChange={onFile} style={{ display: 'none' }} />
      <button className="btn" onClick={() => fileRef.current?.click()}>⬆ Uvezi otpremnicu (.xls)</button>
      {err && <div className="import-err">{err}</div>}
    </div>
  )
}
