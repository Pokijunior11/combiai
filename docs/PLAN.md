# CombiAI — Plan (izvor istine)

> Ovo je glavni dokument. U frišnoj sesiji: pročitaj ovo + `CLAUDE.md`, pa nastavi od **„Trenutni status / sljedeći korak"**.
> Pravilo: čim se nešto odluči ili završi → odmah zapiši ovdje.

---

## Način rada po sesiji (korisnikov dogovoreni ritam) — POŠTUJ OVO
Jedna sesija = jedan mali, zaokružen zadatak. Ciklus:
1. **Početak sesije** (nova ili nakon `/clear`): pročitaj `.md` fajlove koje trebaš — `CLAUDE.md`, ovaj `PLAN.md`, relevantni spec (npr. `docs/ENGINE.md`) — da uhvatiš kontekst i zatečeni status.
2. **Micro-stepping**: implementiraj **jedan mali zadatak, korak po korak** (ne hrpu odjednom).
3. **Testiranje**: provjeri da radi (npr. `node tools/packer-bench.mjs`, app, ili ručna provjera — što god odgovara zadatku).
4. **Ažuriraj dokumentaciju**: zapiši napredak + kontekst u `PLAN.md` (i druge `.md` po potrebi) da iduća sesija zna gdje smo stali.
5. **Git commit** — **tek nakon što korisnik potvrdi da je istestirao** (ne prije).
6. **Clear sesije** → sve ispočetka za idući zadatak.

Poanta: kontekst se drži u `.md` fajlovima (ne u glavi/sesiji), svaki korak je mali i provjeren, commit je čista kontrolna točka. Vidi i „Kako radimo" u `CLAUDE.md`.

---

## 0. Trenutni status / sljedeći korak

### 🎯 MVP RE-FOKUS (odluka korisnika, 2026-07-20) — ČITAJ PRVO
Korisnik: „opet sam otišao na feature koji je relativno bitan, ali ima puno bitnijih stvari. Vraćam se
na MVP, minimalno sljedeće." **Osnovni proces od kraja do kraja = jedini fokus:**

| # | Korak MVP-a | Status |
|---|---|---|
| 1 | **Import otpremnice** | ✅ imam |
| 2 | **Uređivanje** (stavke, količine, ★ mora) | ✅ mogu |
| 3 | **DOBRO SLAGANJE** (motor) | ❌ **FALI — glavni problem.** 👉 Korak 1 (mjerenje) gotov; dalje ide kroz **`docs/ENGINE.md` → „POČNI OVDJE — GRILL ZA MOTOR"** |
| 4 | **Upute skladištaru korak-po-korak** (točno koji artikl na koje mjesto) | ✅ **GOTOVO** (2026-07-20, potvrdio korisnik: „bitno da dobro radi, a radi") |

**Ostalo od koraka 4 (NE blokira korak 3):** vizualne sitnice („ima još vizualnih sitnica, ali to ćemo
kasnije uređivati") + **kriška C = slika barkoda** (`jsbarcode`) — složeno u isti kasniji vizualni prolaz,
jer EAN kao broj već radi provjeru.

**Izvan fokusa dok se 3 i 4 ne zatvore** (ne raditi, ne predlagati): rep za nematchane artikle
(„to ćemo u drugim iteracijama"), ručni dodaj artikl, editiranje naziva kupca, dodatni prioritet-featurei.

- **F0 GOTOVO** ✅ Živi URL: **https://combiai.vercel.app/** (auto-deploy na `git push`). Kod na `github.com/Pokijunior11/combiai` (main, račun Pokijunior11).
- **F1 GOTOVO** ✅ (commit `d9e185e`): demo prenesen u React. Packer node-testiran (parity).
- **F2 GOTOVO** ✅ **i potvrđeno na produkciji** (combiai.vercel.app radi). App čita katalog/kombi iz Supabasea, ekran „Katalog i kombi" (CRUD + uredi kombi).
  - Riješen bug: „Headers Invalid value" = novi red u anon ključu na Vercelu → dodan `.trim()` u `supabase.js`. Lekcija: env „radi lokalno, ne na prod" → posumnjaj na razmak/novi red.
- **Lokalni dev:** `npm run dev -- --port 5190 --strictPort` (port 5190, jer 5173/5174 zauzima drugi projekt na računalu).
- **POJEDNOSTAVLJENO (na zahtjev korisnika)** ✅ — spojeni „Narudžbe" i „Planovi" u JEDAN pojam **„Utovar"**. Uklonjeni linkovi/`?plan=`.
  - **Početni ekran = popis utovara** (najnoviji gore) + gumb „Planiraj novi utovar" + „Osvježi".
  - **Skladištar**: otvori app → popis → klikne „Otvori" → read-only upute (3D + koraci + istovar). Preračunava se iz spremljenog utovara (nema zamrznutog snapshota).
  - **Planer**: „Planiraj novi utovar" ili „uredi" → editor → „Spremi utovar".
  - Podatkovni model: koriste se `orders`/`order_customer`/`order_item` (tablica `plan` iz f4 sad se NE koristi — može ostati prazna).
  - Novi/refaktorirani: HomeList, UtovarView, VanStage, ResultPanel; App presložen; obrisani OrdersList/PlansList/PlanView.
- **F3/F4/F5 objedinjeni u „Utovar" tok** ✅ **POTVRĐENO od korisnika** („to je upravo to što sam htio").
- **Kriška 2 — UVOZ OTPREMNICA GOTOV** ✅ (2026-07-16). Akumulativni editor: **1 otpremnica = 1 kupac**,
  više uploada se slaže po kupcu (isti naziv → dopuni; nova → novi blok), prikaz **broja otpremnice**,
  ±količina / ✕ makni / ★ prioritet, nematchani artikli crveno. SheetJS parser + match po EAN. Detalji §4c.
- 🛑 **VELIKI SLJEDEĆI KORAK — RESET MOTORA SLAGANJA (odluka 2026-07-16).** Korisnik: „htio sam gotov 3D
  bin packing da najbolje utovari kombi, a ne da ručno okrećemo pojedine aparate." Whack-a-mole na
  postojećem `packer.js` (~430 lin. ručnih heuristika) = **znak krivog temelja**. **PRIJE bilo kakvog
  daljnjeg tuniranja motora → evaluacija temelja** (vidi §4, „Reset motora"). Ne štelati aparate
  slučaj-po-slučaj. Odluka o temelju je **korisnikova**; čeka zeleno svjetlo.
- **Ostaje i: F6** — sitna dorada (rubna stanja, mobilni QA, možda auto-osvježavanje popisa). Login nije potreban (nema ga — zajednički pristup).
- **Prioritet DIO 1 GOTOVO** ✅ (2026-07-16, potvrđeno na localhostu) — „mora u kombi" + KOLIČINA po
  stavci, **samo UI + perzistencija** (packer NE dira). Kolona `order_item.must_qty`
  (migracija `supabase/f7_must_qty.sql`); `db.js` sprema/učita; `App.jsx` ★ = uključi/isključi „mora"
  (default svi komadi) + stepper „mora N / qty", smanjenje qty klampa must, obavezne na vrh. DoD (od 5
  mora 3 → spremi → reopen → očuvano) prošao.
- **Prioritet DIO 2 GOTOVO** ✅ (2026-07-20 potvrđeno na localhostu: „kad stavim da je nešto obavezno
  onda to ostavi, a drugo izbaci — super radi") —
  **motor FORSIRA „mora"** kroz **sloj odabira iznad packera** (`app/src/lib/mustFit.js`,
  `computeWithMust`). Packer NIJE diran (crna kutija). Tok: pusti sve → ako obavezno ne stane, izbaci
  najveće NEOBAVEZNE komade i ponovo `computeBest`, dok sva „mora" ne stanu (ili nema više neobaveznog →
  „ne stane ni obavezno"). Rezultat nosi `mustFits`/`mustShort`/`dropped`; `ResultPanel` prikazuje
  „izbačeno da obavezno stane" i „ne stane ni obavezno". Spojeno u `App.jsx` i `UtovarView.jsx`
  (skladištar vidi isti plan). Test `tools/mustfit-bench.mjs` (A stane/B izbaci/C nemoguće/D bez-mora).
- **Ostaje (Kriška 2 rep):** perzistencija **nematchanih** stavki (DB sprema samo matchano), ručni
  „dodaj artikl" bez otpremnice, editiranje naziva kupca.
- **Stack:** Vite + React + react-three-fiber · Supabase · Vercel. Odluke: npm, JavaScript, app u `app/`.

### ✅ Prioritet DIO 2 — MOTOR FORSIRA „mora" (GOTOVO, potvrđeno 2026-07-20)
**Live: čim planer označi ★ „mora", app izbaci najmanje bitne NEOBAVEZNE komade da obavezni stanu.**
- **Riješeno kroz `app/src/lib/mustFit.js` → `computeWithMust(customers, van, products)`** (sloj IZNAD
  packera; `packer.js` NIJE diran — crna kutija). Ugrađeno u `App.jsx` + `UtovarView.jsx`; poruke u
  `ResultPanel.jsx`; test `tools/mustfit-bench.mjs`.
- **Realizirani pristup (kako je i dogovoreno):**
  1. Podijeli na MORA (`must_qty`) i NEOBAVEZNO. 2. `computeBest`; ako sva MORA stanu → gotovo.
  3. Ako neko MORA ne stane → izbaci NAJVEĆI neobavezan komad (volumen, pa težina) i opet `computeBest`,
     dok sva MORA ne stanu ili ponestane neobaveznog. 4. Rezultat: `mustFits`, `mustShort`, `dropped[]`.
- **Detalj „najmanje bitno":** među neobaveznima NEMA ranga → mičemo NAJVEĆE prvo (najviše oslobodi →
  najmanje ukupno izbačeno). Bitna spoznaja iz testiranja: packerove strategije slažu teško/veliko
  PRVO, pa se obavezno istisne samo kad je LAGANO/malo a neobavezno proždire kapacitet (v. bench B).
- **DoD (ispunjen headless u benchu, čeka ručnu localhost provjeru):** označim „mora", dodam višak
  neobaveznog preko kapaciteta → app automatski izbaci neobavezno da „mora" stane i napiše što je izbacio.
- **Poznata dugovanja DIO 2 (za kasnije, ne blokira):** (a) izbacivanje ide po VOLUMENU; kad je preljev
  strogo TEŽINSKI, težinski-prvo bi bilo preciznije. (b) svaki drop = novi `computeBest` (16 packova) →
  za jako velike otpremnice moglo bi biti sporo; optimizirati ako zatreba. (c) izbačeno se ne pamti u
  editoru (samo prikaz) — planer sam smanji količine ako želi trajno.
- **Nije dirano (namjerno):** heuristike u `packer.js`, barkod, redoslijed pod→strop.

---

## 1. Vizija
Računalo brže i bolje od čovjeka složi plan utovara kombija (bijela tehnika), poštujući nosivost i redoslijed istovara, i prikaže ga u 3D-u. Cilj demoa bio je to dokazati — dokazano i validirano.

---

## 1b. Kako kolegica radi DANAS (kao-jest) — temelj zahtjeva (2026-07-16)
> Snimljeno iz razgovora s korisnikom. Ovo je izvor zahtjeva za UI i za pravila enginea. Ne mijenjati napamet — samo dopunjavati kad se sazna više iz prakse.

**Postojeći proces (ručno):**
1. Narudžbe dođu — svejedno je li **jedan kupac (velika ili više manjih/većih narudžbi)** ili **više kupaca**.
2. Kolegica **zbraja težine** aparata dok ne dođe do **nosivosti** kombija → tu stane.
3. Skladištarima da popis → oni **nađu, pripreme i utovare**.
4. **Bolna točka:** često **ne stane prostorno** (ili stane pa se naknadno dodaje) → **tu nastaju greške.**

**Ključni uvid (prava vrijednost aplikacije):** kolegica danas provjerava **samo TEŽINU** — to je jedino što može izračunati unaprijed. **Hoće li stvari stati PROSTORNO ne zna** dok skladištari fizički ne slože, i tu puca. **Aplikacija zatvara tu rupu: provjerava težinu I 3D prostor zajedno, PRIJE utovara.** Zato je engine srce proizvoda, ne kozmetika.

**V1 cilj (korisnikovim riječima):** kolegica u app ubaci **sve narudžbe** (isti tok kao sad), **označi što MORA stati**, dobije jasno **stane / ne stane** (težina + prostor), i istovremeno **najbolji mogući plan utovara**.

**Razjašnjeno (odluke 2026-07-16):**
- **Preljev (što ne stane):** app samo javi **stane/ne-stane + što je višak**; **kolegica ručno odluči** što izbaciti/odgoditi. → V1 = **jedan kombi**, BEZ auto-biranja drugog vozila ni dijeljenja na rute.
- **Istovar:** **oboje, ovisi o danu** — nekad jedan kupac, nekad više kupaca redom. Engine **mora podržati LIFO/multi-drop** kad je više kupaca (zadnji kupac do vrata), i raditi kad je jedan (LIFO neaktivan). → potvrđuje da je multi-drop LIFO stvarno, nepregovaralno pravilo (veže se na §4 „Reset motora").

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

### 🛑 RESET MOTORA — odluka o temelju prije daljnjeg rada (2026-07-16)
**Kontekst:** kroz sesije se motor gradio kao **gomila ručnih heuristika** (topper/filer/domaćin,
containment, 16 strategija; `app/src/lib/packer.js` ~430 lin.). Rezultat: „malo dobro pa nije pa je" u
krug — svaki popravak negdje pomrda drugo. Korisnik (opravdano) stao: **htio je gotov 3D bin packing,
najbolje utovariti kombi, ne ručno okretati pojedine aparate.**

**Ključni uvid — zašto je bilo teško:** generički 3D bin-packing (npm paketi) maksimizira POPUNJENOST,
ali ne zna dva nepregovaralna pravila ove domene: **(1) LIFO istovar po kupcu (multi-drop)**,
**(2) nosivost/oslonac/slaganje**. Ta pravila „ne dolaze besplatno" → zato je nastala ručna gomila.
Pravi naziv problema: **container loading s multi-drop (LIFO) + weight/stability constraints** (teže,
specijalizirano — NE običan bin packing).

### 📊 KORAK 1 GOTOV — MJERENJE (2026-07-20), `tools/real-bench.mjs`
Pokretanje: `cd app && node ../tools/real-bench.mjs` (katalog iz Supabasea, testne otpremnice iz repoa).
Mjeri: popunjenost, masu, pokrivenost poda, **najveći mrtvi džep**, LIFO pomicanja, valjanost,
teoretski maksimum i **PROPUŠTENO** (koliko bi se JOŠ moglo dodati unutar preostale nosivosti).

| scenarij | popunj. | masa% | pomic. | neutov. | propušteno |
|---|---|---|---|---|---|
| 1 kupac (Frigo) | 27.6 | 36 | 0 | 0 | 0 |
| 1 kupac (DomPlus) | 36.3 | 38 | 0 | 0 | 0 |
| 1 kupac, 2 otpremnice (Split 1+2) | 20.1 | 39 | 0 | 0 | 0 |
| 2 kupca | 38.8 | 54 | 0 | 0 | 0 |
| 3 kupca | 58.8 | 82 | 0 | 1 | **1** |
| 4 kupca | 59.7 | 92 | 1 | 8 | **1** |

**Nalazi:**
1. ✅ **Nema kršenja tvrdih pravila** — svi rasporedi valjani, LIFO pomicanja 0 (jednom 1). Motor NIJE
   pokvaren u smislu pravila; ono što radi, radi ispravno.
2. 🔴 **Pravi kvar = FRAGMENTACIJA slobodnog prostora.** Scenarij „3 kupca": sve BI teoretski stalo
   (66% prostora, 90% nosivosti), a motor ipak izostavi **Side-by-Side hladnjak 73×97×199 cm / 116 kg**
   (ne liježe) pri 58.8% popunjenosti i **256 kg slobodne nosivosti**. Pod je pokriven 80.4% → ~1,57 m²
   je slobodno, ali **najveći slobodni pravokutnik je 3,25 × 0,15 m** — trake preuske za bilo što.
   Prostor postoji, samo je razmrvljen. To je klasičan simptom greedy/extreme-points pristupa.
3. ⚖️ **Dobitak od boljeg motora je ovdje MALEN: 2 komada kroz 6 scenarija.** Prva verzija mjerila je
   pokazivala 9 — griješila je jer je brojala svaki komad koji *pojedinačno* stane po težini, a svi
   zajedno probiju nosivost. Ispravljeno na pohlepno-od-najlakšeg.

**⚠️ ZAŠTO OVO JOŠ NE ODLUČUJE — dva ozbiljna ograničenja mjerenja:**
- **Testne otpremnice su SINTETIČKE** — generirao ih je `tools/make_test_otpremnice.mjs` s ciljem
  „realna kilaža do ~1400 kg". Dakle to što masa udara u strop pri ~59% prostora može biti **posljedica
  načina na koji sam ih složio**, a ne stvarnost.
- **Kombi je PLACEHOLDER** (4,0 × 2,0 × 2,30 m, 1400 kg — iz demoa). Prave dimenzije i nosivost mijenjaju
  cijelu sliku: ako je nosivost manja, težina veže još ranije i bolji motor vrijedi još manje; ako je
  veća, prostor postaje usko grlo i motor vrijedi više.
- **Napetost sa stvarnošću:** mjerenje kaže da težina veže prije prostora (82-92% mase pri ~59% prostora),
  a §1b kaže da kolegici u praksi **„često ne stane prostorno"**. To se ne slaže → znak da sintetički
  podaci ne opisuju prave narudžbe. **Treba pravi profil narudžbe + prave podatke kombija prije odluke.**

**Plan (kad korisnik da zeleno) — vremenski ograničen spike, pa ODLUKA o temelju:**
1. **Real bench PRVO** — `tools/` skripta koja pušta motor na **prave otpremnice** (`Otpremnica-*.xls`)
   i mjeri: popunjenost, mrtvi podni džepovi (rupe), poštivanje LIFO-a, valjanost. (Metodologija §4c korak 3.)
2. **Usporedi 2–3 temelja** na istim podacima:
   - (a) specijalizirani **container-loading solver/API** s multi-drop + težinom (gotovo, bez našeg održavanja),
   - (b) **constrained optimizer** (npr. OR-Tools CP-SAT — pravila deklarativno),
   - (c) postojeći `packer.js` (baseline).
3. **Korisnik bira temelj** → tek onda dalje. **NE** nastavljati case-by-case tuning postojećeg motora.

**Poznata dugovanja** (iz `issue.txt` i dogovora):
- [ ] Orijentacija polegnutog hladnjaka: uspravljanje mora biti ravnopravna opcija kad se tako bolje puni (npr. sušilica gore), ne fiksno 4 u vis.
- [ ] Prerukavanje pri istovaru — trenutačno se izbjegava; razraditi kad je nužno.
- [ ] Težište / raspodjela po osovinama (stabilnost vožnje).
- [ ] Stabilnost stogova, prepust/djelomični oslonac.
- [ ] Prave dimenzije/kilaže po SKU.

---

## 4b. UI/UX dorade (backlog — nakon što V1 radi od kraja do kraja)
> Izgled/osjećaj React app-a vs demo. Ne blokira F2–F6. Triježa: neke sitnice možda uđu u V1 ako su brze.
- [ ] Sakriti „uredi/obriši" od skladištara (uloge planer/skladištar). **Nisko prioritetno** — korisnik OK da za sad ostane (interni alat, neće se zloupotrebljavati).
- [ ] (ostale sitnice — korisnik nabraja kad uoči)

## 4c. Od „pogađanja" prema pravilima po artiklu (metodologija — priprema za produkciju)
> Kontekst: kroz sesiju 2026-07-15 motor je **pogađao uloge iz težine/visine** (topper/domaćin/filer).
> Skoro svi rubni bugovi bili su u tom pogađanju, ne u samom slaganju. S pravim podacima (Heinner Excel)
> prelazimo na **eksplicitne atribute po artiklu** → predvidljivo, bez „jedno pomrda kad drugo napravimo".

**Princip — 3 odvojena sloja:**
1. **PODACI** — svaki artikl ima atribute (u `article` tablici).
2. **PRAVILA** — motor **čita atribute**, ne pogađa iz brojki.
3. **TESTOVI** — svaki slučaj/pravilo = red u `tools/packer-bench.mjs`. Ovo je ključ protiv regresija
   („jedno pomrda drugo") — svaki popravak mora ostaviti sve stare bench-slučajeve valjane.

**Atributi po artiklu (počni s malo, dodaj kad zatreba — ne svih 20 odjednom):**
- Fizika: dužina, širina, visina (brutto), težina — ✅ imamo.
- `smije_lijegati` (orijentacija) — ✅ imamo (`canLie`).
- `krhko` / `max_na_vrhu_kg` — smije li se i koliko stavljati na vrh (0 = ništa; npr. TV, staklo).
- `par_id` (ili `grupa`) — dvije jedinice klime (unutarnja+vanjska) moraju zajedno/blizu.
- (kasnije po potrebi: `kategorija` za defaulte, „mora uspravno u vožnji", stohovanje…).

**Heinner Excel — realno:** daje **dimenzije, težinu, kategoriju, EAN/SKU**. Domenska pravila
(`krhko`, `par`, orijentacija) proizvođač NE daje → njih definiraš ti, najlakše **po kategoriji**
(npr. „klima → par", „TV → krhko+uspravno") uz iznimke po pojedinom SKU.

**Koraci (redoslijed):**
1. Pogledati Heinner Excel — koje kolone stvarno ima → **mapirati** na naše fizičke atribute.
2. Dopuniti `article` tablicu **domenskim kolonama** — počni s onima koje SAD trebaš (klime: `par_id`),
   ne svima odjednom.
3. **Uvoz Excela → seed kataloga** (fizika iz Excela; domenska pravila default po kategoriji, pa ručno tune).
4. Motor: zamijeniti „pogađanje" (heuristike po težini/visini) **čitanjem atributa** — jedno po jedno
   pravilo, svako s bench-testom.
5. **Klime (par)** — novo pravilo „grupa mora zajedno/blizu"; dizajnirati zasebno (motor to još ne zna).

**Odgovori na dvojbe (2026-07-15):**
- „Jesam li prvo trebao pripremiti sve podatke?" — **Ne.** Nisi mogao znati koja pravila trebaš dok ih
  nisi vidio na primjerima. Reaktivno otkrivanje ti je REKLO koji atributi su bitni. Sad ih formaliziraš —
  to je normalan, dobar redoslijed (spiralno, ne vodopad).
- „Ima li bolji način od kolona+pravila?" — Za ovu domenu (fizička ograničenja, mora biti **objašnjivo
  skladištaru**) atributi+pravila su pravi izbor. Alternativa (čisti optimizacijski solver / ML) je
  nepredvidljiva i teško objašnjiva — ne paše.

**Status 2026-07-15:** Kriška 1 gotova — Heinner **MDA (bijela tehnika)** uvezen u `article`
(364 artikla, brutto dim + `ean` + `category`), alat `tools/import_heinner.py` (idempotentan,
preskače postojeće/dedup po `code`). Dodane kolone `ean`, `category`. Packer rubni
slučajevi = zaseban track (Kolosijek B), nakon eksplicitnih pravila po artiklu.

**Kriška 2 — upload otpremnice (akumulativni editor):**
- **MODEL (ispravljeno na zahtjev korisnika):** **jedna otpremnica = jedan kupac.** Planer uploada
  **više** otpremnica koje se **akumuliraju po kupcu**: isti naziv kupca → dopune se njegove stavke
  (ista šifra → zbroji količinu); novi naziv → novi blok kupca ispod. NEMA više katalog-grida (svih 364
  artikla × kupci) — zamijenjen listom blokova kupaca.
- ✅ **Parser + matcher** `app/src/lib/importOtpremnica.js` (SheetJS `xlsx`).
  `parseOtpremnica(arrayBuffer)` → `{ docNo, customers:[{name, items:[{ean,rawName,qty,jmj,grupa}]}] }`
  (grupira po `NAZIV_KUPCA`); `matchToCatalog` → match po `ean` (+ `stats`). Odbacuje ne-Synesis
  datoteke (provjera zaglavlja). Node-testirano.
- ✅ **UI editor** `App.jsx` + `OtpremnicaImport.jsx`: gumb „Uvezi otpremnicu" (višekratni upload,
  akumulira). Svaki kupac = blok: naziv + stavke ispod, svaka s **±količina**, **✕ makni artikl**,
  **★ prioritet** („mora u kombi", prioritetne idu na vrh liste). Nematchane stavke prikazane
  crveno („nije u katalogu") i uklonjive. Packer/3D/spremanje rade nad matchanim stavkama.
- ✅ **Testni fixt+generator** `tools/make_test_otpremnice.mjs` → jednokupčane otpremnice s Heinner
  robom (sve se matcha): `Otpremnica-Split-1/-2.xls` (isti kupac → test spajanja), `-Maric.xls`,
  `-DomPlus.xls`, `-Frigo.xls`. Simulirano headless (accumulate + `computeBest`): 3 uploada → 2 kupca
  (Split spojen), packer 20/20.
- ⏳ **Ostaje:** (a) **prioritet u packer** — trenutačno samo vizualno/sortiranje, motor ga još ne
  forsira (nosivost/„mora stati" = Kolosijek B). (b) **perzistencija** prioriteta i nematchanih stavki
  (DB `order_item` nema kolone → spremaju se samo matchane stavke). (c) ručni **dodaj artikl** iz
  kataloga (bez otpremnice). (d) editiranje **naziva kupca**.
- ⚠️ **Realnost:** pravi `Otpremnica.xls` = klime (SAX), kojih NEMA u Heinner katalogu → svi unmatched
  dok se ne uvezu dim (HOME COMFORT / AC 2026 = parovi). `Otpremnica.xls` (ime pravog kupca) NIJE u repou.

**Tehnički mapping za Kriška 2 (otkriveno 2026-07-15):**
- **Heinner Excel** `HEINNER _Q2_ADRIA.xlsx` (u korisnikovom `Downloads`, ne u repou): listovi
  `SDA, PERSONAL CARE, MDA, HOME COMFORT, AC 2026`. Za utovar: **MDA** (bijela tehnika, uvezeno),
  kasnije HOME COMFORT + **AC 2026** (klime = parovi, novo pravilo). Header je **red 2** (1-based;
  red 1 = grupni merge header). Kolone: `Category, Code, Photo, Description, Origin, EAN`, pa
  **Product dims** (L,W,H,Weight), pa **Package box dims = BRUTTO** (L,W,H,Weight) ← ove koristimo,
  pa `HS CODE, Stock`. Visina zna biti raspon („60.5 - 88.5") → uzmi veći broj. Import je već u
  `tools/import_heinner.py`.
- **Otpremnica** `Otpremnica.xls` (Synesis ERP, stari .xls; xlrd ga čita): flat, 1 red = 1 stavka,
  zaglavlje dokumenta ponovljeno u svakom redu. Bitne kolone (0-based): `[33] SIFRA_ROBE = EAN`,
  `[34] NAZIV_ROBE_USLUGE`, `[35] JMJ`, `[41] GRUPA_ROBA_USLUGA`, `[46] KOLICINA`,
  `[14] NAZIV_KUPCA`, `[0] R_BROJ` (dokument). **Match: otpremnica.SIFRA_ROBE ↔ article.ean.**
  Drugi brendovi (npr. „SAX" klima, EAN ne počinje 5949…) se NE matchaju dok nemamo njihove dim.
- **`article` tablica** (Supabase): `id, code, name, ean, category, length_cm, width_cm, height_cm,
  weight_kg, can_lie, created_at`. Dim u **cm** (packer dijeli sa 100 → m). `can_lie` default false
  (Heinner ne daje orijentaciju → tuning po §4c). U bazi 373 (364 Heinner + 9 demo).
- **Narudžbe model** (`db.js`): `orders`→`order_customer`(name,color,position)→`order_item`
  (article_id, qty). Upload otpremnice puni upravo ovo: grupiraj stavke po `NAZIV_KUPCA` → kupci.
- **Frontend za Kriška 2:** `npm i xlsx` (SheetJS, čita .xls i .xlsx u pregledniku); UI gumb u
  `UtovarView.jsx`; match u novi `lib/importOtpremnica.js`; postojeći `packer.js` ostaje.
- **UI zahtjevi za upload (korisnik, 2026-07-15):** nakon uvoza otpremnice u sučelju se mora moći:
  (a) **dodati** artikl, (b) **maknuti** artikl — i onaj koji postoji u katalogu i onaj koji ne
  postoji (ručna korekcija nakon matcha), (c) **označiti prioritet** artikla/pošiljke. (Trenutni +/-
  ostaje za testiranje.) Naziv artikla u editoru: **proizvođač + model** (npr. „Heinner {code}"),
  ne cijeli marketinški opis — riješeno u `App.jsx`/`db.js` za Heinner (po `ean`).

---

## 4d. Ciljni UI tok (iz §1b, snimljeno 2026-07-16) — UI backlog
> Kako korisnik zamišlja tok. „✅ imamo" = već radi; „⏳" = treba doraditi/dodati. Vadimo stavku po stavku (micro-stepping), ne sve odjednom.

**Načelo:** „app javi stane/ne-stane" = app je **već fizički složila** kako stane. Odgovor = plan, nema odvojenog koraka.

**PLANER — kolegičin „playground" (živi izračun uz bok):**
1. ✅ „Planiraj novi utovar" tipka.
2. ✅ „Uvezi otpremnicu" → dolje se pojavi **kupac + broj otpremnice + stavke**.
3. ✅ Druga otpremnica **istog kupca** → grupira pod isti kupac; vidljivi **svi brojevi otpremnica** (Kriška 2).
4. ✅/⏳ **PROFINJENJE prioriteta:** po artiklu **„mora u kombi" + KOLIČINA** koja mora (npr. 3 od 5). **DIO 1 (UI+perzistencija) ✅** — ★ + stepper „mora N/qty", sprema se u `must_qty`. **DIO 2 (motor forsira) ✅** (čeka localhost potvrdu) — sloj odabira `mustFit.js` iznad packera (vidi §0).
5. ✅/⏳ **Uz bok se ODMAH** računa najbolji utovar + **stane/ne-stane** (reaktivno već postoji; kvaliteta = §4 „Reset motora").
6. ✅ „Spremi utovar" → gotovo. Nove otpremnice kolegica radi sama izvan app-a.

**SKLADIŠTAR — upute korak po korak:**
- ✅ Otvori spremljeni utovar → read-only upute (3D + koraci + istovar).
- ⏳ Svaki korak prikaže: **naziv, šifra, BARKOD** (novo — katalog ima `ean` → iscrtati barkod), i **mjesto u kombiju**.
- ⏳ **Redoslijed koraka:** od **kabine prema vratima**, i **od poda prema stropu** (logičan slijed utovara). Izvor: `issue.txt` („po redu od kabine do vrata, ali od odozdo prema gore").

**🟡 MVP korak 4 — UPUTE KORAK-PO-KORAK (implementirano 2026-07-20, čeka localhost potvrdu)**
- **Novo:** `app/src/lib/loadSteps.js` (`orderForLoading`, `buildLoadSteps`) + `components/LoadSteps.jsx`,
  ugrađeno u `UtovarView.jsx` (skladištarov ekran). Stilovi u `App.css` (`.loadsteps` …).
- **Ključni popravak redoslijeda:** stari sort u `VanStage` bio je čisti `x → y → z`, što zna tražiti da se
  kutija utovari **prije one na kojoj stoji** (fizički nemoguće). Izmjereno: u **2 od 15** scenarija
  (`node tools/loadsteps-bench.mjs` + stress) davao je nemoguće korake. Sad je **topološki**: oslonac uvijek
  prije onoga što na njemu stoji, a među „spremnima" bira kabina→vrata, pa pod→strop. Ispunjava issue.txt.
- **VanStage 3D klizač koristi ISTI redoslijed** (`orderForLoading`) — inače 3D i tekstualni popis ne govore isto.
- **Po koraku se vidi:** redni broj, naziv, **šifra**, **EAN**, kg, kupac (+ boja), i mjesto:
  „na pod / na vrh: {što je ispod}", strana (lijevo/sredina/desno) i **m od kabine**.
- **Test:** `node tools/loadsteps-bench.mjs` — 3 scenarija, tvrdi uvjet „nijedna kutija prije svog oslonca". ✅
- **Svjesno NIJE u ovom koraku:** barkod kao **slika** (za sad EAN kao tekst — render treba lib);
  strana lijevo/desno je konvencija „gledano iz kabine prema vratima" → ako je u praksi obrnuto, samo se okrene.

### 📐 SPEC — „Način utovara" za skladištara (dogovoreno s korisnikom 2026-07-20, prije koda)
> Nastalo iz grill-sesije nad screenshotom. Prvi pokušaj (tekstualni popis svih koraka) korisnik je
> odbio: **„ne izgleda nikako i prekomplicirano je"**. Ovo je dogovorena zamjena. Ne mijenjati napamet.

**Uređaj:** VELIKI TABLET na nosaču na stranici kombija (NE mobitel, NE jedna ruka) → 3D ostaje
**rotabilan**, ima mjesta za veliki raspored. Vodilja korisnika: *„kao da malom djetetu daš uputu i da
se ne pogubi — sve lijepo prikazano, a sastrane male dodatne stvari."*

**Ekran 1 — „Otvori" (pregled, kao do sada):** gotov složeni utovar u 3D-u, sve brojke ostaju
**sastrane, male**, + **velika tipka „KRENI UTOVAR" po sredini**.
- MAKNUTI (izričit zahtjev): kutija „Kombi 4.0 × 2.0 × 2.30 · nosivost · vrata straga" i podatak **„najviši stup"**.
- Ostalo (iskorištenost, težina, plan istovara, kupci, izbačeno) **ostaje**.

**Ekran 2 — način „korak po korak"** (tipke, NE klizač):
- **Fokus je 3D**, velik: već utovareno **blijedo**, trenutni artikl **jarko**, sljedeći **obris/isprekidano**.
- **Kartica artikla — hijerarhija po korisniku** *(„gleda po šifri jer je velika i tako najbrže zna koji
  je artikl, onda provjeri po barkodu jer nazivi znaju biti jako slični, a barkod je jedinstven")*:
  1. **ŠIFRA — najveće** (`article.code`, npr. `HSBS-HM522MDNFXE++`) → brzo snalaženje.
  2. **Naziv** — manje (kontekst).
  3. **Barkod: slika crta, a ISPOD veliki broj EAN-a** → provjera.
  4. **Gdje ide, riječima:** npr. „DESNO DOLJE · na pod · uz kabinu". 5. kg + dimenzije.
- **„ZATIM:" (sljedeći artikl)** — dolje desno, mali (šifra + gdje ide).
- **Tipke: ◀ NATRAG · SLJEDEĆE ▶** (velike). **Naprijed/natrag u svakom trenutku, uključujući s kraja.**
- **Žive brojke sastrane** — utovareno N/M, iskorištenost %, težina — **rastu/padaju paralelno** sa
  stiskanjem naprijed/natrag (ne ukupne, nego „do ovog koraka").
- **KRAJ:** zadnji korak samo **označi kraj** (nema posebnog ekrana/čestitke); natrag se vraća normalno.

**Tvrda pravila (korisnik izričito):**
- **STROGO REDOM — nema preskakanja.** Nema „oštećen"/„nema na skladištu" — to se rješava PRIJE utovara.
- **Korak se PAMTI** (tablet se ugasi/uspava/refresh → nastavlja gdje je stao), lokalno na uređaju.
- **Klizač „Korak utovara" ostaje PLANERU**, kod skladištara ga nema (inače dva izvora istine).

**Provedba u 3 kriške:** **A = čišćenje + 2 buga ✅** (2026-07-20, čeka localhost potvrdu) ·
**B = jezgra načina utovara** (kartica, ZATIM, tipke, žive brojke, 3D u 3 stanja, pamćenje koraka) ⏳ ·
**C = slika barkoda** (`jsbarcode`, jedina dodaje ovisnost) ⏳.

**Kriška A — što je napravljeno (2026-07-20):**
- `app/src/lib/labels.js` (NOVO) — `labelOf`/`codeOf` na JEDNOM mjestu; maknut duplikat iz `App.jsx` i
  `mustFit.js`. Kratki naziv sad i u `loadSteps.js`, `ResultPanel` („nije stalo") i `packer.js`
  (blokatori u planu istovara) — svugdje je curio marketinški opis.
- Lijevo/desno **okrenuto** u `loadSteps.js` (+ obrazloženje geometrije u komentaru). Dodano
  `depth` („uz kabinu / sredina / do vrata") i `headline` („DESNO DOLJE") za karticu iz kriške B.
- Maknuto: kutija s dimenzijama kombija (`van-info`) iz `UtovarView` (planeru u `App.jsx` OSTAJE)
  i „najviši stup" iz `ResultPanel` (oboma).
- **Obrisan `components/LoadSteps.jsx`** (odbijeni tekstualni popis) + njegov CSS. `lib/loadSteps.js`
  (topološki redoslijed) OSTAJE — kriška B ga koristi.
- Provjera: `npm run build` ✓, `node tools/loadsteps-bench.mjs` ✓, `node tools/mustfit-bench.mjs` ✓.

**Kriška B — jezgra načina utovara (2026-07-20, čeka localhost potvrdu):**
- `components/LoadMode.jsx` (NOVO) — cijeli način „korak po korak": kartica (ŠIFRA krupno → naziv →
  EAN razlomljen `5 949123 456789` → „DESNO DOLJE" → kg/dim), „ZATIM" blok, velike tipke
  ◀ NATRAG / SLJEDEĆE ▶, žive brojke sastrane, 3D bez klizača.
- `lib/loadSteps.js` → **`stepView(steps, i, van)`** — SVA logika koraka je čista funkcija, ne u
  komponenti. Namjerno: off-by-one u brojkama se okom ne vidi, a ovako se testira.
  Dogovor: na koraku `i` komadi `0..i-1` su utovareni, `i` je onaj koji se nosi → brojke = `slice(0,i)`.
- `lib/loadProgress.js` (NOVO) — pamćenje u `localStorage` po `orderId`, čuva `{active, i}`.
  **Lokalno, NE u bazi**: napredak je stvar tog tableta i tog utovara; u bazi bi se dva uređaja gazila
  i tražilo bi mrežu koje u kombiju zna nestati. Ako se tablet ugasi dok je `active` → `UtovarView`
  vraća RAVNO u način utovara. „✕ Prekini" ne briše korak (nudi „NASTAVI UTOVAR (korak N)").
  Korak se klampa na raspon ako je planer u međuvremenu promijenio utovar.
- `VanScene.jsx` — kutije podržavaju `_vis`: `done` (blijedo 0.18) / `current` (puna boja, jak obrub) /
  `next` (obris, crveno). Bez `_vis` = planerov pogled, nepromijenjen.
- `VanStage.jsx` — nova prop `showSlider` (default `true`). **Planer zadržava klizač, skladištar ne.**
- Test: `tools/loadsteps-bench.mjs` proširen — rubni koraci 0 i n, monotonost brojki, točno jedan
  „current", najviše jedan „sljedeći", klamp izvan raspona, zadnji korak nema „sljedeći". ✅
- ⚠️ **NEPROVJERENO: sam IZGLED/raspored.** Nema browser-automatizacije u repou (playwright bi bio nova
  teška ovisnost) → logika je testirana, ali kako to stvarno izgleda na tabletu mora potvrditi korisnik.

**Riješeno iz koda tijekom dogovora (ne pitati ponovno):**
- 🐛 **BUG — naziv artikla:** `packer` u `placed` nosi sirovi `p.name` = cijeli marketinški opis
  („Full No Frost,Total capacity: 522L,…") → zato je izgledalo grozno. `App.jsx:15` već ima `labelOf`
  (`Heinner {code}`), ali se ne koristi na ovom putu. **Izdvojiti `labelOf` u zajednički modul** (sad
  dupliran u `App.jsx` i `mustFit.js`) i koristiti ga svugdje.
- 🐛 **BUG — lijevo/desno bilo NAOPAKO.** Geometrija (`VanScene`): kabina na −X, vrata na +X. Kombi vozi
  prema kabini, pa vozač i promatrač s vrata gledaju u **isti** smjer → lijevo/desno im se poklapa.
  Dakle **desno (suvozač) = MALI `z`**, lijevo = veliki `z`. `loadSteps.js` trenutno tvrdi obrnuto.
- **„Šifra" je dvoznačna:** `article.code` = Heinnerova model-oznaka (velika na kutiji) — **TU koristimo**;
  a u Synesis otpremnici je `SIFRA_ROBE` zapravo **EAN**. Ne pobrkati.

**Otvorena profinjenja (iz ovog toka):**
- [ ] Prioritet = „mora u kombi" + količina (ne boolean) → i vizualno i **u packeru** (motor to forsira; veže se na §4/§4c).
- [ ] Barkod u uputama skladištaru (render iz `ean`).
- [ ] Redoslijed koraka pod→strop uz kabina→vrata (provjeriti da ga trenutni prikaz poštuje).

---

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

### Faze 3–5 — objedinjene u „Utovar" tok ✅ GOTOVO i POTVRĐENO
- Jedan pojam „Utovar" (roba + preračunati raspored). Početni ekran = popis; planer spremi/uredi; skladištar „Otvori" → read-only upute.
- **Gotovo kad:** planer složi i spremi utovar, skladištar ga otvori na mobitelu i prati. ✅ Korisnik potvrdio „to je upravo to što sam htio".

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
- **2026-07-15** Kriška 1: Heinner MDA katalog uvezen (364 art., brutto dim + EAN + kategorija). Metodologija §4c (atributi po artiklu + pravila + bench-testovi) usvojena.
- **2026-07-16** Kriška 2 GOTOVA: uvoz Synesis otpremnica (SheetJS, match po EAN), akumulativni editor (1 otpremnica=1 kupac, broj otpremnice, ±/makni/★prioritet).
- **2026-07-16** 🛑 RESET MOTORA SLAGANJA: prekid s ručnim tuniranjem heuristika. Odluka — prije daljnjeg rada evaluirati gotove temelje (container-loading solver/API s multi-drop, ili OR-Tools) vs. postojeći `packer.js` na pravim otpremnicama; korisnik bira temelj. Detalji §4 „Reset motora". Pauzirano na korisnikov zahtjev.
- **2026-07-16** Prioritet DIO 1 GOTOVO: „mora u kombi" + KOLIČINA po stavci (UI + perzistencija, packer ne dira). Kolona `order_item.must_qty` (`supabase/f7_must_qty.sql`), `db.js` save/load, `App.jsx` ★+stepper. Potvrđeno na localhostu. DIO 2 (motor forsira „mora") = idući korak; dogovoren pristup = sloj odabira iznad packera (crna kutija, bez diranja heuristika → ne otvara §4 Reset).
- **2026-07-16** Snimljen KAO-JEST proces kolegice (§1b) kao temelj zahtjeva. Ključni uvid: danas se provjerava samo težina, ne prostor → app zatvara tu rupu (težina + 3D zajedno). Odluke: (1) preljev = app javi višak, čovjek ručno odlučuje → V1 jedan kombi, bez auto-vozila/ruta; (2) istovar = i jedan i više kupaca → engine mora podržati multi-drop LIFO. Katalog za engine ≠ svi aparati: motor je geometrija+pravila, treba pokriti rubne SLUČAJEVE (visok/plosnat/težak/liježe/krhko/par), ne cijeli katalog; puni katalog treba samo za matching otpremnica.
