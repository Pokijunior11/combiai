# CombiAI — Plan (izvor istine)

> Ovo je glavni dokument. U frišnoj sesiji: pročitaj ovo + `CLAUDE.md`, pa nastavi od **„Trenutni status / sljedeći korak"**.
> Pravilo: čim se nešto odluči ili završi → odmah zapiši ovdje.

---

## 0. Trenutni status / sljedeći korak
- **F0 GOTOVO** ✅ Živi URL: **https://combiai.vercel.app/** (auto-deploy na `git push`). Kod na `github.com/Pokijunior11/combiai` (main, račun Pokijunior11).
- **F1 GOTOVO** ✅ (commit `d9e185e`): demo prenesen u React. Packer node-testiran (parity).
- **F2 GOTOVO** ✅ **i potvrđeno na produkciji** (combiai.vercel.app radi). App čita katalog/kombi iz Supabasea, ekran „Katalog i kombi" (CRUD + uredi kombi).
  - Riješen bug: „Headers Invalid value" = novi red u anon ključu na Vercelu → dodan `.trim()` u `supabase.js`. Lekcija: env „radi lokalno, ne na prod" → posumnjaj na razmak/novi red.
- **Lokalni dev:** `npm run dev -- --port 5190 --strictPort` (port 5190, jer 5173/5174 zauzima drugi projekt na računalu).
- **Sljedeći korak: F3** — narudžbe u bazi (tablice `order` + `order_item`; editor sprema/učitava narudžbu).
- **Stack:** Vite + React + react-three-fiber · Supabase · Vercel. Odluke: npm, JavaScript, app u `app/`.

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

- [x] **P1. Korisnici i scenarij** ✅ **ODLUČENO:** primarni = **planer/disponent** (ured, desktop) koji složi i **spremi** plan; sekundarni = **skladištar** (mobitel/tablet) koji spremljeni plan **otvori i prati** pri utovaru.
- [x] **P2. Single-company ili SaaS** ✅ **ODLUČENO:** V1 = **single-tenant** (jedna firma), ali podatkovni model postavljamo čisto da se **multi-tenant (SaaS) doda kasnije** bez rušenja. SaaS infrastruktura se NE gradi u V1.
- [x] **P3. Baza** ✅ **ODLUČENO:** treba (scenarij planer↔skladištar traži dijeljeno spremanje). Tehnologija = **Supabase** (PostgreSQL + prijava + API + hosting u jednom). Spremamo: vozila, katalog robe, narudžbe, spremljene planove. Besplatni plan za početak.
- [x] **P4. Odakle dolaze narudžbe** ✅ **ODLUČENO:** V1 = **ručni unos (A)**. Sljedeća iteracija = **uvoz Excel/CSV (B)**. Dugoročni cilj = **integracija (C)**.
  - **Stvarni sustavi (za roadmap B/C):** narudžbe ulaze preko **PrestaShop** (ima REST API + težinu/dimenzije po artiklu); otpremnice se rade u **Synesis** (ERP, izlazna strana). Težnja je automatizacija.
- [x] **P5. Katalog robe** ✅ **ODLUČENO:** V1 = **ručni katalog u našoj bazi**, kasnije punjen/sinkroniziran iz **Excela proizvođača** (tamo su stvarni podaci; PrestaShop ih NEMA).
  - **DOMENSKO PRAVILO:** za utovar se koriste **BRUTTO** (zapakirane) dimenzije i težina — tovari se artikl u kutiji. Netto podatke možemo čuvati info, ali packer računa brutto.
  - Korisnik ima Excele više proizvođača sa svim podacima (netto + brutto) → kandidat za jednokratni uvoz pri seedanju kataloga (odlučiti u faznom planu).
- [x] **P6. Prijava/računi** ✅ **ODLUČENO:** V1 = **jedan zajednički račun, bez vidljive prijave**. App se automatski autentificira u pozadini; sesija se sama obnavlja da radnici nikad ne zapnu na loginu. Nema uloga (svi mogu sve).
  - Kompromis (prihvaćen): nema razlikovanja planer/skladištar, i tko ima URL može pristupiti → OK za interni alat. Prave račune + uloge dodajemo kasnije ako zatreba.
  - Opcionalno kasnije bez logina: obični „mod" prekidač (planer/skladištar pogled) radi jednostavnijeg ekrana skladištaru.
- [x] **P7. Platforma i stack** ✅ **ODLUČENO:** **Vite + React + react-three-fiber** (logika slaganja iz demoa se prenosi), backend/baza **Supabase**, hosting **Vercel** (auto-deploy iz gita). Responsive web (kao demo); PWA kasnije po potrebi. Korisnik ima GitHub; Vercel se poveže GitHub prijavom.
- [x] **P8. Definicija V1** ✅ **ODLUČENO:** V1 = katalog (ručno seedan) + **jedan** kombi + unos narudžbe + izračun plana + spremanje + otvaranje na drugom uređaju (skladištar). NE uključuje: Excel uvoz, PrestaShop/Synesis, prave račune, Kolosijek B, multi-tenant, PWA, ispis.
  - Vozila: **samo jedan kombi** u V1.
  - Katalog: **ručno seedanje** ~10-15 stvarnih artikala.

---

## 4. Kolosijek B — dubina logike slaganja (trajni backlog, ne blokira A)
Poznata dugovanja (iz `issue.txt` i dogovora):
- [ ] Orijentacija polegnutog hladnjaka: uspravljanje mora biti ravnopravna opcija kad se tako bolje puni (npr. sušilica gore), ne fiksno 4 u vis.
- [ ] Prerukavanje pri istovaru — trenutačno se izbjegava; razraditi kad je nužno.
- [ ] Težište / raspodjela po osovinama (stabilnost vožnje).
- [ ] Stabilnost stogova, prepust/djelomični oslonac.
- [ ] Prave dimenzije/kilaže po SKU.

---

## 4b. UI/UX dorade (backlog — nakon što V1 radi od kraja do kraja)
> Izgled/osjećaj React app-a vs demo. Ne blokira F2–F6. Triježa: neke sitnice možda uđu u V1 ako su brze.
- [ ] (popuniti — korisnik nabraja razlike/popravke uočene na React verziji)

## 5. Fazni plan (V1)
> Minimalno-prvo. Svaka faza: **cilj → gotovo kad (definition of done) → commit**. Radi se jedna po jedna.
> „👤 Ti" = zadaci koje korisnik mora napraviti (računi, ključevi). „🤖 Ja" = kod/postavljanje.

### Faza 0 — Kostur + živi URL (tracer bullet) ✅ GOTOVO
- 🤖 Novi Vite + React projekt + react-three-fiber. 🤖 Supabase klijent. 🤖 Deploy na Vercel.
- 👤 Supabase projekt + Vercel prijava; ključevi dani.
- **Gotovo kad:** app živi na Vercel URL-u i objavi se sama na `git push`. ✅ https://combiai.vercel.app/

### Faza 1 — Prijenos demoa u React (bez baze) ✅ GOTOVO (d9e185e)
- 🤖 Packer + 3D prikaz + editor iz `demo-utovar-kombija.html` prebaciti u React/r3f, podaci u memoriji.
- **Gotovo kad:** ista funkcionalnost kao demo, ali u novom stacku (izračun + 3D + korak utovara + plan istovara). ✅
- Bonus: OrbitControls (drei) → touch rotacija + pinch-zoom ugrađeni; reaktivni izračun (bez „Izračunaj" gumba).

### Faza 2 — Baza: katalog + kombi ✅ GOTOVO
- 🤖 Tablice: `article`, `vehicle`. CRUD ekran za katalog. Uređivanje jednog kombija.
- 👤 Dati mi podatke za ~10-15 stvarnih artikala (brutto dim + težina) za seed. ← još stoji: seed su za sad demo-artikli; prave upisati kroz ekran „Katalog i kombi".
- **Gotovo kad:** katalog i kombi se čuvaju u bazi i mogu se uređivati. ✅

### Faza 3 — Narudžbe u bazi
- 🤖 Tablice `order`, `order_item`. Editor narudžbe čita katalog iz baze i sprema narudžbu.
- **Gotovo kad:** planer složi i spremi narudžbu; ostane spremljena.

### Faza 4 — Generiranje i spremanje plana
- 🤖 Tablica `plan`. Pokreni packer nad spremljenom narudžbom, spremi rezultat.
- **Gotovo kad:** plan se generira iz narudžbe i trajno sprema.

### Faza 5 — Otvaranje plana na drugom uređaju (skladištar)
- 🤖 Popis spremljenih planova → otvori jedan → mobilni prikaz s korakom utovara i planom istovara.
- **Gotovo kad:** planer spremi na desktopu, skladištar otvori na mobitelu i prati utovar. Scenarij radi od početka do kraja.

### Faza 6 — Dorada za stvarnu upotrebu
- 🤖 Auto zajednička sesija (bez logina), prazna/greška stanja, mobilni QA.
- **Gotovo kad:** upotrebljivo u pogonu bez čudnih rubnih situacija.

---

## 6. Log odluka
- **2026-07-10** Demo validiran, prelazimo na planiranje prave app.
- **2026-07-10** Proces rada: `CLAUDE.md` (auto) + ovaj `PLAN.md` (izvor istine) + git po fazama + `/handoff` za prekid usred posla.
- **2026-07-10** Kolosijek B (logika) odvojen od Kolosijeka A (proizvod) da ne blokira napredak.
- **2026-07-10** P1: primarni korisnik = planer (desktop, sprema plan); sekundarni = skladištar (mobitel, izvršava plan).
- **2026-07-10** P2: V1 single-tenant, dizajn spreman za kasniji multi-tenant/SaaS.
- **2026-07-10** P3: baza = Supabase (PostgreSQL). Daje i prijavu + API + hosting → utječe na P6/P7.
- **2026-07-10** P4: V1 ručni unos → B uvoz (Excel/CSV) → C integracija. Sustavi: PrestaShop (ulaz narudžbi, ima API+dimenzije), Synesis (otpremnice/ERP).
- **2026-07-10** P5: V1 ručni katalog; stvarni podaci iz Excela proizvođača (PrestaShop nema dim/tež). Packer koristi BRUTTO dimenzije/težinu.
- **2026-07-10** P6: V1 bez vidljive prijave — jedan zajednički račun, auto-sesija, bez uloga. Prioritet: radnik ne smije zapeti na loginu.
- **2026-07-10** P7: stack = Vite + React + react-three-fiber; baza Supabase; hosting Vercel (auto-deploy iz GitHuba).
- **2026-07-10** P8: V1 opseg definiran (katalog + 1 kombi + narudžba + izračun + spremanje + otvaranje na mobitelu). Vozila: jedan kombi. Katalog: ručno seedanje. → Fazni plan (sekcija 5) složen, planiranje gotovo.
