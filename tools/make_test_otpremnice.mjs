// Generira testne Synesis otpremnice (.xls) po uzoru na pravi Otpremnica.xls,
// s Heinner artiklima (matchaju se po EAN) i realnom kilažom do ~1400 kg.
// Pokretanje:  cd app && node ../tools/make_test_otpremnice.mjs
import fs from 'fs'
import { createRequire } from 'module'
// xlsx je instaliran u app/node_modules → resolvaj ga odande (skripta se pokreće iz app/)
const require = createRequire(process.cwd() + '/package.json')
const XLSX = require('xlsx')

const ROOT = '..' // repo root (skripta se pokreće iz app/)
const env = fs.readFileSync('.env', 'utf8')
const URL = env.match(/VITE_SUPABASE_URL=(\S+)/)[1].trim()
const KEY = env.match(/VITE_SUPABASE_ANON_KEY=(\S+)/)[1].trim()

// Kolone (0-based) — isti mapping kao parser (PLAN.md §4c)
const COL = { doc: 0, datum: 1, kupac: 14, ean: 33, name: 34, jmj: 35, grupa: 41, qty: 46 }

// Preuzmi pravo zaglavlje (74 kolone) iz stvarne otpremnice da format bude identičan.
const realBuf = fs.readFileSync(`${ROOT}/Otpremnica.xls`)
const realWs = XLSX.read(realBuf, { type: 'buffer' }).Sheets['Otpremnica']
const HEADER = XLSX.utils.sheet_to_json(realWs, { header: 1, raw: true, defval: null })[0]

// --- definicija otpremnica: JEDNA otpremnica = JEDAN kupac ---
// Uploadi se akumuliraju po kupcu; Split-1 i Split-2 su isti kupac (test spajanja stavki).
const DOCS = [
  {
    file: 'Otpremnica-Split-1.xls', doc: 3101, datum: '15.07.2026',
    customer: 'Bijela Tehnika Split d.o.o.', items: [
      ['5949494012852', 3], // perilica 76kg
      ['5949494041470', 1], // škrinja 45kg
      ['5949494040848', 2], // ugr. mikrovalna 17.6kg
    ],
  },
  {
    file: 'Otpremnica-Split-2.xls', doc: 3102, datum: '15.07.2026',
    customer: 'Bijela Tehnika Split d.o.o.', items: [
      ['5949494012852', 2], // ISTA perilica → spaja se na Split-1 (qty 3+2=5)
      ['5949088504770', 3], // napa 18kg
      ['5949088525010', 2], // ugr. mikrovalna 18.29kg
    ],
  },
  {
    file: 'Otpremnica-Maric.xls', doc: 3103, datum: '15.07.2026',
    customer: 'Elektro Marić Rijeka', items: [
      ['5949494019363', 3], // side-by-side 88kg
      ['5949494007445', 2], // perilica 74kg
      ['5949088504770', 2], // napa 18kg
    ],
  },
  {
    file: 'Otpremnica-DomPlus.xls', doc: 3104, datum: '15.07.2026',
    customer: 'Dom Plus Zadar', items: [
      ['5949494044051', 3], // kombi hladnjak 83kg
      ['5949494028778', 2], // no-frost hladnjak 79kg
      ['5949494041463', 2], // škrinja 36kg
      ['5949088525010', 3], // ugr. mikrovalna 18.29kg
    ],
  },
]

async function fetchCatalog(eans) {
  const list = [...new Set(eans)].map((e) => `"${e}"`).join(',')
  const r = await fetch(`${URL}/rest/v1/article?select=code,name,ean,weight_kg&ean=in.(${list})`, {
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY },
  })
  const rows = await r.json()
  return new Map(rows.map((a) => [String(a.ean), a]))
}

function buildSheet(docDef, cat) {
  const aoa = [HEADER]
  for (const [ean, qty] of docDef.items) {
    const row = new Array(HEADER.length).fill(null)
    const art = cat.get(ean)
    row[COL.doc] = docDef.doc
    row[COL.datum] = docDef.datum
    row[COL.kupac] = docDef.customer
    row[COL.ean] = ean
    row[COL.name] = art ? `HEINNER ${art.code}` : ean
    row[COL.jmj] = 'kom'
    row[COL.grupa] = 'BIJELA TEHNIKA'
    row[COL.qty] = qty
    aoa.push(row)
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Otpremnica')
  return wb
}

const allEans = DOCS.flatMap((d) => d.items.map((i) => i[0]))
const cat = await fetchCatalog(allEans)

let missing = 0
for (const d of DOCS) {
  let total = 0, lines = 0, units = 0
  for (const [ean, qty] of d.items) {
    const art = cat.get(ean)
    if (!art) { console.log(`  ⚠️  ${d.file}: EAN ${ean} NEMA u katalogu`); missing++; continue }
    total += Number(art.weight_kg) * qty; lines++; units += qty
  }
  const wb = buildSheet(d, cat)
  XLSX.writeFile(wb, `${ROOT}/${d.file}`, { bookType: 'xls' })
  const flag = total > 1400 ? '  ❗ PREKO 1400kg' : ''
  console.log(`✅ ${d.file}: ${d.customer} — ${lines} stavki, ${units} kom, ${total.toFixed(1)} kg${flag}`)
}
if (missing) console.log(`\n❗ ${missing} EAN-ova nije nađeno — provjeri.`)
