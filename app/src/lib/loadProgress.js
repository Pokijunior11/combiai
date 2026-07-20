// Pamćenje napretka utovara — LOKALNO na uređaju (tablet u kombiju), ne u bazi.
//
// Zašto lokalno: napredak je stvar TOG tableta i TOG utovara u tijeku. Da ide u bazu, dva
// skladištara na dva uređaja bi se gazila, a i tražilo bi mrežu koje u kombiju zna nestati.
//
// Zahtjev korisnika: „Pamti se trenutni korak, ako se ugasi ili nešto, ostaje na tome."
// Zato pamtimo i `active` — da se nakon gašenja vrati RAVNO u način utovara, a ne na pregled.

const keyFor = (orderId) => `combiai:utovar:${orderId}`

export function readProgress(orderId, maxStep = Infinity) {
  try {
    const raw = localStorage.getItem(keyFor(orderId))
    if (!raw) return null
    const v = JSON.parse(raw)
    if (typeof v?.i !== 'number') return null
    // Plan se u međuvremenu mogao promijeniti (planer uredio utovar) → ne ostavljaj korak izvan dosega.
    return { active: !!v.active, i: Math.max(0, Math.min(maxStep, v.i)) }
  } catch { return null }
}

export function writeProgress(orderId, { active, i }) {
  try { localStorage.setItem(keyFor(orderId), JSON.stringify({ active, i })) } catch { /* privatni način / pun disk */ }
}

export function clearProgress(orderId) {
  try { localStorage.removeItem(keyFor(orderId)) } catch { /* nema veze */ }
}
