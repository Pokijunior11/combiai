# CombiAI — Plan (izvor istine)

> Ovo je glavni dokument. U frišnoj sesiji: pročitaj ovo + `CLAUDE.md`, pa nastavi od **„Trenutni status / sljedeći korak"**.
> Pravilo: čim se nešto odluči ili završi → odmah zapiši ovdje.

---

## 0. Trenutni status / sljedeći korak
- **Faza:** planiranje prave aplikacije (Kolosijek A), još prije koda.
- **Upravo radimo:** definiramo proizvod — tko koristi, kako, treba li baza, odakle podaci.
- **Sljedeći korak:** odgovoriti na otvorena pitanja u sekciji 3 (jedno po jedno), pa iz toga složiti fazni plan (sekcija 5).

---

## 1. Vizija
Računalo brže i bolje od čovjeka složi plan utovara kombija (bijela tehnika), poštujući nosivost i redoslijed istovara, i prikaže ga u 3D-u. Cilj demoa bio je to dokazati — dokazano i validirano.

---

## 2. Demo/PoC — što je napravljeno (✅ gotovo)
Datoteka: `demo-utovar-kombija.html` (vanilla JS + Three.js).

Dogovorena pravila (v1 logike):
- Kombi 4,0 × 2,0 × 2,30 m, nosivost **1400 kg** (placeholder).
- **Kupac 1 = uz kabinu** (prvi utovaren). Istovar obrnut: Kupac N → … → 1. Vrata samo straga, ravno izvlačenje.
- Tvrda pravila: stane (AABB), ne preklapa, masa ≤ nosivost, `masa_gore ≤ masa_dolje`, **pun oslonac**.
- Orijentacija po artiklu: uspravno (yaw 90°); **mali frižider ≤150 cm smije leći** i slagati se u vis.
- Ciljevi (meko): (1) max utovareno, (2) min pomicanja pri istovaru.
- Algoritam: greedy (extreme-points + AABB), 3 strategije → bira najbolju. Smije ostaviti neutovareno i prijaviti.
- UI: editor kupaca/artikala + „Primjer A/B", 3D prikaz, klizač+tipke „korak utovara" (kabina→vrata), plan istovara s „pomakni X". Mobilno: responsive + pinch-zoom.

---

## 3. Kolosijek A — proizvod/arhitektura (🔜 ODLUČUJEMO SAD)
Otvorena pitanja (rješavamo jedno po jedno, svako s preporukom):

- [ ] **P1. Korisnici i scenarij** — tko primarno koristi (planer u uredu? skladištar na mobu? vozač? vlasnik?). *Preporuka: primarni = planer (desktop) koji sprema plan, sekundarni = skladištar (mobitel) koji ga izvršava.*
- [ ] **P2. Single-company ili SaaS** — interni alat za jednu firmu ili proizvod za više firmi (multi-tenant)?
- [ ] **P3. Baza — treba li i za što** (spremanje narudžbi, plana, kataloga robe, vozila, korisnika)?
- [ ] **P4. Odakle dolaze narudžbe** — ručni unos, uvoz (Excel/CSV), ili integracija s postojećim ERP/webshopom?
- [ ] **P5. Katalog robe** — odakle stvarne dimenzije/kilaže (ručni unos, baza dobavljača, barkod)?
- [ ] **P6. Prijava/računi** — treba li login, uloge (planer/skladištar/admin)?
- [ ] **P7. Platforma i stack** — web (React?), PWA za mobitel, hosting?
- [ ] **P8. Definicija „minimalne prave verzije" (V1)** — najmanji skup da je stvarno upotrebljivo u pogonu.

---

## 4. Kolosijek B — dubina logike slaganja (trajni backlog, ne blokira A)
Poznata dugovanja (iz `issue.txt` i dogovora):
- [ ] Orijentacija polegnutog hladnjaka: uspravljanje mora biti ravnopravna opcija kad se tako bolje puni (npr. sušilica gore), ne fiksno 4 u vis.
- [ ] Prerukavanje pri istovaru — trenutačno se izbjegava; razraditi kad je nužno.
- [ ] Težište / raspodjela po osovinama (stabilnost vožnje).
- [ ] Stabilnost stogova, prepust/djelomični oslonac.
- [ ] Prave dimenzije/kilaže po SKU.

---

## 5. Fazni plan (popunjava se nakon sekcije 3)
> Minimalno-prvo. Svaka faza: cilj → gotovo kad → commit.
- (TBD nakon što zaključimo Kolosijek A)

---

## 6. Log odluka
- **2026-07-10** Demo validiran, prelazimo na planiranje prave app.
- **2026-07-10** Proces rada: `CLAUDE.md` (auto) + ovaj `PLAN.md` (izvor istine) + git po fazama + `/handoff` za prekid usred posla.
- **2026-07-10** Kolosijek B (logika) odvojen od Kolosijeka A (proizvod) da ne blokira napredak.
