// Privremeni (hardcoded) katalog i podaci — u Fazi 2 seli se u Supabase bazu.
// Dimenzije u METRIMA (brutto/zapakirano), težina u kg.
// l = duljina (X), w = širina (Z), h = visina (Y). canLie = smije se položiti.

export const VAN = { L: 4.0, W: 2.0, H: 2.30, payload: 1400 }

export const PRODUCTS = {
  hladnjak:  { name: 'Hladnjak',          l: 0.60, w: 0.65, h: 1.85, weight: 75, canLie: false },
  mfrizider: { name: 'Mali frižider',     l: 0.55, w: 0.55, h: 1.40, weight: 38, canLie: true },
  zamrzivac: { name: 'Zamrzivač škrinja', l: 0.80, w: 0.65, h: 0.85, weight: 45, canLie: false },
  perilica:  { name: 'Perilica rublja',   l: 0.60, w: 0.60, h: 0.85, weight: 70, canLie: false },
  susilica:  { name: 'Sušilica',          l: 0.60, w: 0.60, h: 0.85, weight: 35, canLie: false },
  posudje:   { name: 'Perilica posuđa',   l: 0.60, w: 0.60, h: 0.82, weight: 40, canLie: false },
  stednjak:  { name: 'Štednjak',          l: 0.60, w: 0.60, h: 0.90, weight: 50, canLie: false },
  mikro:     { name: 'Mikrovalna',        l: 0.50, w: 0.40, h: 0.30, weight: 15, canLie: true },
}

// Kupac 1 = prvi utovaren = uz kabinu. Istovar obrnut: Kupac N -> ... -> 1.
export const DEFAULT_CUSTOMERS = [
  { name: 'Kupac 1', color: '#e0783f', qty: { hladnjak: 1, perilica: 1, mikro: 1 } },
  { name: 'Kupac 2', color: '#2f7dd1', qty: { posudje: 1, perilica: 1, stednjak: 1 } },
  { name: 'Kupac 3', color: '#4fa06a', qty: { mfrizider: 2, susilica: 1, perilica: 2 } },
]

export const EXAMPLES = {
  a: [
    { hladnjak: 1, perilica: 1, mikro: 1 },
    { posudje: 1, perilica: 1, stednjak: 1 },
    { mfrizider: 2, susilica: 1, perilica: 2 },
  ],
  b: [
    { perilica: 2, hladnjak: 1, mikro: 1 },
    { zamrzivac: 1, posudje: 1, stednjak: 1 },
    { mfrizider: 3, perilica: 2, susilica: 1 },
  ],
}
