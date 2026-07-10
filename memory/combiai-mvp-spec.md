---
name: combiai-mvp-spec
description: Dogovorena specifikacija CombiAI MVP-a — 3D bin packing za utovar kombija (bijela tehnika)
metadata:
  type: project
---

CombiAI = demo/PoC koji dokazuje da deterministička heuristika (ne ML; smije se zvati "AI" prema van) posloži bijelu tehniku u kombi brže i bolje od čovjeka, poštujući nosivost i istovarivost.

Sve živi u jednoj datoteci: `demo-utovar-kombija.html` (vanilla JS + Three.js r128 s CDN-a). Korisnik je izričito htio zadržati taj UI i raditi u njemu; React/Vite je odbačen za MVP (opcija tek za produkciju).

Dogovorena pravila (v1):
- Kombi 4,0 × 2,0 × 2,30 m, nosivost **1400 kg** (placeholder za demo).
- **Kupac 1 = uz kabinu** (prvi utovaren). Istovar je OBRNUT: Kupac 3 → 2 → 1 (vrata samo straga, ravno izvlačenje).
- Tvrda pravila: stane (AABB), ne preklapa, ukupna masa ≤ nosivost, `masa_gore ≤ masa_dolje` (isti artikli smiju jedan na drugi), **pun oslonac** (ništa ne lebdi).
- Orijentacija po artiklu: sve uspravno (yaw 90°); **mali frižider ≤150 cm smije leći** i slagati se u vis.
- Ciljevi (meko, tim redom): (1) utovariti što više, (2) najmanje pomicanja pri istovaru. Težište/osovine → produkcija.
- LIFO je MEKO: kupci se smiju miješati radi punjenja; prihvatljivo je da vozač makne poneki artikl drugog kupca uz napomenu "pomakni X", ali to se minimizira.
- Algoritam: vlastita greedy heuristika (extreme-points + točna AABB), 3 strategije sortiranja → bira raspored po (max utovareno, pa min pomicanja). Smije ostaviti robu neutovarenom i to prijaviti.

Van dometa MVP-a: ML, bočna vrata, koso vađenje, prepust/djelomični oslonac, težište, prave dimenzije/kilaže dobavljača, spremanje/baza.

Provjereno Node test-harnessom (scratchpad `test-packer.mjs`): sva tvrda pravila drže, Kupac 1 uz kabinu, nosivost binding u stres-testu. Korisnik potvrdio "dobro radi" uz sitne dorade koje slijede.
