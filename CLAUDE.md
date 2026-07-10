# CombiAI

Aplikacija za pomoć pri planiranju i utovaru kombija (bijela tehnika).
Jezgra: 3D bin packing s pravilima **nosivosti** i **istovarivosti (LIFO)**, uz 3D prikaz plana.

## Status (ažuriraj čim se nešto promijeni)
- ✅ **Demo/PoC gotov i validiran** — dionici odobrili, radi i na mobitelu. Vidi `demo-utovar-kombija.html`.
- 🔜 **Kreće planiranje prave aplikacije.**
- 👉 **Izvor istine je `docs/PLAN.md` — pročitaj ga prije bilo kakvog rada.**

## Kako radimo (proces)
- Sav dogovor, odluke i fazni plan drže se u **`docs/PLAN.md`**. Ažuriraj ga čim se nešto **odluči** ili **završi** (ne čekaj kraj sesije).
- **Minimalno-prvo**: jedna faza = jedan zaokružen komad → provjeri da radi → commit → update statusa u `PLAN.md`.
- Dva kolosijeka:
  - **A — arhitektura/proizvod** (platforma, baza, korisnici, hosting). Planira se sad.
  - **B — dubina logike slaganja** (sitna pravila pakiranja). Zaseban, trajan; ne blokira A.
- Kraj sesije usred posla → pokreni **`/handoff`** da se stanje zapiše za nastavak.

## Pokretanje demoa
- Statična datoteka. Otvori `demo-utovar-kombija.html` u pregledniku,
  ili posluži lokalno: `python -m http.server 8000` → `http://localhost:8000/demo-utovar-kombija.html`
  (za mobitel: PC-ov LAN IP umjesto localhost, isti Wi-Fi).

## Stack
- **Demo:** vanilla JS + Three.js (r128, CDN), sve u jednoj HTML datoteci.
- **Prava app:** TBD — odlučuje se u `docs/PLAN.md` (Kolosijek A).

## Otvorena pitanja / poznata dugovanja
- Logika slaganja (Kolosijek B): orijentacija polegnutog hladnjaka, prerukavanje, težište/osovine, stabilnost. Detalji u `docs/PLAN.md`.
