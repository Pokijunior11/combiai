import * as XLSX from 'xlsx'

// Uvoz Synesis otpremnice (.xls/.xlsx) → kupci + stavke, pa match po EAN na katalog.
// Format: flat tablica, 1 red = 1 stavka; zaglavlje dokumenta ponovljeno u svakom redu.
// Kolone (0-based) — vidi PLAN.md §4c "Tehnički mapping":
const COL = {
  doc: 0,      // R_BROJ (broj dokumenta)
  kupac: 14,   // NAZIV_KUPCA
  ean: 33,     // SIFRA_ROBE = EAN  → match na article.ean
  name: 34,    // NAZIV_ROBE_USLUGE
  jmj: 35,     // JMJ (kom…)
  grupa: 41,   // GRUPA_ROBA_USLUGA
  qty: 46,     // KOLICINA
}

// Ćelija → čist string. Brojevi (npr. 1594.0, EAN kao broj) bez repa ".0".
function clean(v) {
  if (v == null) return ''
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v).replace(/\.0+$/, '')
  return String(v).trim()
}

// arrayBuffer (iz <input type=file>) → { docNo, customers:[{ name, items:[{ ean, rawName, qty, jmj, grupa }] }] }
export function parseOtpremnica(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('Datoteka nema nijedan list.')
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null })
  const header = rows[0] || []
  if (clean(header[COL.ean]) !== 'SIFRA_ROBE' || clean(header[COL.kupac]) !== 'NAZIV_KUPCA') {
    throw new Error('Ne izgleda kao Synesis otpremnica (nema kolone SIFRA_ROBE / NAZIV_KUPCA).')
  }

  const byCustomer = new Map() // čuva redoslijed pojavljivanja kupaca
  const docs = new Set()
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue
    const ean = clean(r[COL.ean])
    const rawName = clean(r[COL.name])
    if (!ean && !rawName) continue // prazan / razdjelni red
    const qty = Number(r[COL.qty]) || 0
    const kupac = clean(r[COL.kupac]) || 'Nepoznat kupac'
    const doc = clean(r[COL.doc])
    if (doc) docs.add(doc)
    if (!byCustomer.has(kupac)) byCustomer.set(kupac, [])
    byCustomer.get(kupac).push({ ean, rawName, qty, jmj: clean(r[COL.jmj]), grupa: clean(r[COL.grupa]) })
  }
  if (byCustomer.size === 0) throw new Error('Otpremnica nema nijednu stavku.')

  const customers = [...byCustomer.entries()].map(([name, items]) => ({ name, items }))
  return { docNo: [...docs].join(', '), customers }
}

// Pridruži svaku stavku artiklu iz kataloga po EAN. products = lista iz fetchArticles() (ima .ean, .id, dim).
// Vraća kupce sa stavkama { ean, rawName, qty, jmj, grupa, article|null } + brojač matched/unmatched.
export function matchToCatalog(parsed, products) {
  const byEan = new Map(products.filter((p) => p.ean).map((p) => [String(p.ean).trim(), p]))
  let matched = 0
  let unmatched = 0
  const customers = parsed.customers.map((c) => ({
    name: c.name,
    items: c.items.map((it) => {
      const article = (it.ean && byEan.get(it.ean)) || null
      if (article) matched += 1
      else unmatched += 1
      return { ...it, article }
    }),
  }))
  return { docNo: parsed.docNo, customers, stats: { matched, unmatched } }
}
