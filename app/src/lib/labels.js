// Kratki naziv artikla — JEDNO mjesto istine (prije dupliciran u App.jsx i mustFit.js).
//
// Zašto: `article.name` iz Heinner Excela je cijeli marketinški opis
// („Full No Frost,Total capacity: 522L,Fridge capacity: 343L,…") — neupotrebljiv u popisu i
// katastrofalan u uputama skladištaru. Skladištar se snalazi po ŠIFRI (`code`), pa nju pokazujemo.
//
// Napomena: `code` = proizvođačeva model-oznaka (velika na kutiji). NIJE isto što i `SIFRA_ROBE`
// iz Synesis otpremnice — ondje je „šifra" zapravo EAN.

export const labelOf = (p, fallback = '?') => (p ? (p.code ? `Heinner ${p.code}` : p.name) : fallback)

// Samo šifra, bez proizvođača — za krupni ispis na kartici utovara.
export const codeOf = (p, fallback = '?') => (p ? (p.code || p.name || fallback) : fallback)
