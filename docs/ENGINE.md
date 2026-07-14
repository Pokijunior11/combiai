# CombiAI — Motor slaganja (Kolosijek B)

> Cilj: složiti robu tako da **što više stane** i da je **fizički ispravno/stabilno**, uz poštovanje istovara (LIFO).
> Pristup: **Pravilnik → Mjerilo → Test-scenariji → Iteracija algoritma** (svaka promjena se mjeri).

## STATUS (gdje smo stali)
- ✅ Dijagnoza gotova (sekcija 1.4): male stvari (mikrovalne) idu na POD umjesto na VRH → lažni „ne stane".
- ✅ Mjerilo spremno: `node tools/packer-bench.mjs` reproducira sve slučajeve (CASE-1a/1b/3/4 + REF).
- ✅ **MODEL DOGOVOREN kroz grillanje (2026-07-13)** — vidi sekciju **1.6 (Model — dogovoreno)**. Stari „vreća globalnih strategija" napušten.
- ✅ **MOTOR PRESLOŽEN po sekciji 1.6 (2026-07-13).** Dvije faze: (1) struktura po kriškama kupac-po-kupac (kabina→vrata, granica se pomiče); (2) fileri u tavan, svaki ≥ granica svog kupca (nikad unatrag = LIFO po dubini), radije u svojoj zoni pa naprijed. Deterministički jedan prolaz, bez best-of strategija.
  - **Mjerilo (`node tools/packer-bench.mjs`):** sve stane, sve valjano. CASE-1a 30/30 (2 pom.), **CASE-1b 31/31** (3 pom., bug riješen), CASE-3 42/42 (2), CASE-4 33/33 (0), REF 12 i 18 (0). Pomicanja = jeftini „forward spill" mikrovalnih kupca 1 na tavan K2/K3.
- ✅ **DVIJE DORADE nakon 1. testa u aplikaciji (2026-07-13):**
  1. **Struktura se GRADI U VIS prije pomicanja dublje** (ključ `[x,y,z]` umjesto `[y,x,z]`). Prije: pod se razvukao pa se tek onda slagalo u vis → ponestane dužine → izbaci robu. Sad: puni presjek (kriška) od poda do stropa pa se granica pomakne. Provjereno: CASE-5 (8 suš+4 pos) dubina 1.20 m / 2 sloja; CASE-6 (12 malih frižidera) 4 sloja u vis.
  2. **Fileri idu na NAJBLIŽEG susjeda (i unatrag prema kabini), ne samo naprijed** — bodovanje po udaljenosti od kriške svog kupca; kap: najviše jedna kriška unatrag (da ne odlutaju kao na screenshotu). Backward na susjeda uz kabinu je često 0 pomicanja (skine se s vrha kad taj kupac izlazi).
- ✅ **3. DORADA (screenshot 14:16):** struktura se pakira **KONTINUIRANO** (jedna sekvenca, redoslijed kupaca), bez resetiranja reda po kupcu. Prije: kupac ostavi pola reda praznog, sljedeći kreće novi red → prazni slotovi. Sad: sljedeći kupac **nastavi puniti započeti red** (K1 zauzme 3+1, K2 popuni preostala 2 mjesta istog reda). LIFO drži (kasniji kupac je bok-uz-bok ranijem, nikad iza). CASE-7 potvrđuje: 0 praznih slotova, 0 pomicanja.
- ✅ **4. DORADA (screenshot 14:25):** filer se bira po **TOČNOM trošku pomicanja** — za svaku kandidat-poziciju broji koliko bi KASNIJIH kupaca blokirao (front/above, isto kao `unloadPlan`). Bira poziciju s 0 (ili min) blokada. Efekt: mikrovalne se pune na **svog/ranijeg kupca (tavan prema kabini) „koliko ostane"**, a na kasnijeg (prema vratima) tek kad nema drugog mjesta. CASE-8 potvrđuje: K2 mikrovalne odu na tavan K1, 0 pomicanja. (Prije: išle na K3 → moralo se micati pri istovaru K3.)
- ✅ **5. DORADA (screenshot 15:05) — TVRDI LIFO za strukturu:** ključ `[x,y,z]` je pohlepno vukao strukturu KASNIJEG kupca natrag na tavan RANIJEG (npr. zelena sušilica zapela na narančastom, IZA plavih → nedostupno pri prvom istovaru). Sad `structureBlocked()` tvrdo zabranjuje: (a) da komad bude ZAROBLJEN — raniji kupac ISPRED (prema vratima) u istom y-z kanalu; (b) da blokira kasnijeg kupca. **Slaganje kasnijeg NA ranijeg je DOZVOLJENO** (K2 na K1, bok uz bok — skine se s vrha kad taj kupac izlazi); zabranjeno je samo biti *zarobljen iza*. (Fileri = mekano bodovanje po trošku; struktura = teška → TVRDO.) CASE-9: K3 struktura ostaje uz vrata (x 2.37+), 0 pomicanja, sve stane. Pouka: broj pomicanja PODCJENJUJE ovakav bug (bio „2") jer teški dizaj vrijedi kao lagani → zato tvrdi filter.
- ✅ **6. DORADA (screenshot 16:52) — filer se GNIJEZDI u rupu:** prije su mikrovalne išle na max visinu (`-y`) → znale završiti izložene na vrhu frižidera (mogle skliznuti u vožnji). Sad `containment()` broji koliko je strana kutije prislonjeno uz drugu kutiju/stijenku, pa filer bira NAJUGNIJEŽĐENIJU poziciju (rupu/nišu) prije nego niže/bliže. Struktura (teška) i dalje sama sjeda u rupe (to je već radilo). CASE-10: mikrovalne sjednu u nišu iznad veš mašine (3 strane), ne na vrh frižidera.
- ✅ **7. DORADA (screenshot 09:49) — MAX-LOAD pretraga (protiv lažnog „ne stane"):** jedan pohlepni prolaz je znao zapeti (npr. 2+2+3 frižidera → 1 ne stane, a dodaš li 3. frižider → SVE stane; besmisleno). Sad `computeBest` pokreće `packOnce` za **više strategija** (redoslijed strukture × ključ pozicije = `STRUCT_CMPS × STRUCT_KEYS`, sad 4×2=8) i uzima najbolji VALJANI raspored po `betterResult` (najviše komada → najveći volumen → najmanje pomicanja → najveća masa). Dodavanje strategije nikad ne pogorša (monoton max). CASE-11: prije 31/32, sad **32/32**. ~130–190 ms po izračunu (OK za reaktivni UI).
  - **VAŽNO (nije proturječje s „ne vreća heuristika"):** korisnik je ranije odbio pristup gdje su strategije BILE model (pogađanje umjesto pravila). Ovdje je model (tvrda pravila + LIFO) fiksan i čist; pretraga samo bira gušće punjenje UNUTAR tog modela — točno kako rade „check max load" alati. Cilj: motor = max-load, uz LIFO.
- ▶️ **Sljedeći korak:** korisnik testira dalje (cilj: ponaša se kao max-load, bez lažnog „ne stane"). **Otvoreni „drugi problem" (screenshot 16:50): STABILNOST rasporeda** — dodavanje artikla prepakira SVE od nule (reaktivni recompute) pa raspored skače. Cilj #4. Pravi popravak = inkrementalno/stabilno pakiranje — veći zahvat, zasebno. Ostalo: prag `isFiller` (visina ≤ 0.5 m), uspravljanje polegnutih, možda više strategija / lokalna pretraga ako se pojavi novi lažni „ne stane".

## 1. Pravilnik (rulebook) — u izradi (grillanje)
Sva stvarna pravila slaganja. Popunjava se kroz razgovor.

### 1.1 Već potvrđeno (iz ranijeg dogovora)
- Tvrdo: sve stane (AABB), bez preklapanja, **pun oslonac**, `masa_gore ≤ masa_dolje`, ukupna masa ≤ nosivost.
- Orijentacija po artiklu: uspravno (yaw 90°); mali frižider ≤150 cm smije leći (i slagati se u vis).
- Ciljevi (meko): (1) max utovareno, (2) min pomicanja pri istovaru. LIFO: Kupac 1 uz kabinu, istovar obrnut.

### 1.2 Ključni uvidi (grillanje)
- **PRAVA SVRHA = feasibility check:** „stane li naručeno u kombi?" 3D raspored je dokaz, ne cilj sam po sebi.
  - Motor mora biti POUZDAN: nikad „stane" kad ne stane; rijetko „ne stane" kad zapravo stane.
  - **Glavni tehnički cilj = smanjiti lažne „ne stane"** (naći valjan raspored kad god postoji). Zadnjih 2% gustoće manje bitno od točnosti odluke.
- **LIFO je prioritet #1** (iznad maks. punjenja): tovari kupac-po-kupac po redu; skladištar ne smije kopati.
- Pravila su malobrojna i „logična": teško dolje (frižideri/veš mašine, jedno na drugo, polegnuto), sitno gore/u rupe. Nema egzotičnih pravila.

### 1.3 LIFO — precizno (potvrđeno)
- **„Iza" (dublje prema kabini) = ZABRANJENO:** roba kasnijeg kupca ne smije zarobiti robu ranijeg prema vratima. Nema kopanja u dubinu. Ako to znači da nešto ne stane → prijavi „ne stane".
- **„Odozgo" u istom redu = DOPUŠTENO:** jedno na drugom od dva različita kupca je OK (skladištar samo podigne s vrha). Svesti na minimum.

### 1.4 GLAVNA DIJAGNOZA (iz 4 screenshota, 2026-07-13)
**Male lagane stvari (mikrovalne) idu na POD umjesto na VRH frižidera.** Frižider 185 cm u kombiju 230 cm → 45 cm „tavana" iznad svakog frižidera je idealan za mikrovalne. Motor ih baca na pod → kradu mjesto frižiderima → lažni „ne stane".

Test-scenariji (katalog: hladnjak 60×65×185/75kg, mikrovalna 50×40×30/15kg liježe, sušilica 60×60×85/35kg):
- **CASE-1a (radi):** K1{hladnjak1, mikrovalna16, susilica2} K2{hladnjak4} K3{hladnjak7} → 30 kom, sve stane, 55.6%.
- **CASE-1b (BUG):** isto ali mikrovalna17 → **2 hladnjaka NE STANU**. Apsurd: dodaš 1 mikrovalnu, ispadnu 2 frižidera. 12 frižidera lako stane na pod (potrebno ~4.7 m² od 8 m²) — mikrovalne im kradu pod.
- **CASE-2 (radi ok):** K2 mikrovalne sjednu na K2 frižidere (isti kupac ima frižidere).
- **CASE-3 (LIFO):** K3 mikrovalne završe nedostupno („predaleko") → 2 pomicanja; trebale bi biti na vrhu/u prvom redu do K3.

Ciljevi popravka (redom): (1) male na vrh frižidera (fill „tavana"), ne na pod; (2) NIKAD izbaciti veliko zbog malog (ocjena po volumenu, ne po broju komada); (3) male slagati LIFO-dostupno; (4) stabilnost (mala promjena ≠ velika preslagivanja).

### 1.5 Ostalo
- Polegnuti frižider: fiksno 4 u vis; ne razmatra uspravljanje da npr. sušilica dođe gore. → riješeno modelom 1.6 (orijentacija = čista gustoća).

### 1.6 MODEL — dogovoreno (grillanje 2026-07-13) ⭐ IZVOR ISTINE ZA MOTOR
Cijeli motor stane u nekoliko fizičkih pravila. **Nema pravila po artiklu** — sve slijedi iz dimenzija i težine iz kataloga.

**Cilj:** maksimalna iskoristivost tovarnog prostora (što više aparata stane). Pomicanja pri istovaru su **zanemariva** — u najboljem slučaju tiebreaker kad dvije varijante trpaju jednako. Fit je kralj (= i minimum lažnih „ne stane").

**Tvrda pravila (fizika):** stane (AABB), bez preklapanja, **pun oslonac**, **teže dolje / lakše gore** (`masa_gore ≤ masa_dolje`), ukupna masa ≤ nosivost.

**Dvije osi, samo jedna je stroga:**
1. **DUBINA (kabina↔vrata) = STROGI LIFO.** Kupci se tovare redom: Kupac 1 uz kabinu … Kupac N uz vrata. Roba svakog kupca je **skupljena u svojoj kriški** (contiguous pojas po dužini). Nikad se ništa ne stavlja *iza* (dublje prema kabini) tuđe robe tako da bi se moralo kopati. Granica se pomiče samo prema vratima.
2. **VISINA (slaganje na vrh) = slobodno, vlada samo težina.** Bilo što smije na vrh bilo čega dok je teže dolje. Istovar ide odozgo-prema-dolje pa se gornje samo digne u stranu (mjesta ima kako se kombi prazni) — jeftino, nebitno.

**ALI: LIFO vrijedi i u visinu (3D).** Ono složeno gore mora ostati u kriški svog kupca — ne smije odletjeti do kabine na tuđu robu. Istovar mora teći vrata→kabina čisto na **svakoj visini**. (Bug s ekrana: plave/zelene mikrovalne rasute skroz do kabine → prekršaj.)

**Struktura vs filer (samo za redoslijed slaganja, ne tvrdo pravilo):**
- **Struktura** = veliko/visoko (frižideri, veš mašine, sušilice…). Zauzima **pod** (pod je dragocjen), popločava krišku po širini pa se penje.
- **Filer** = nisko/lagano (mikrovalne). Puni **tavan** (zrak iznad struktura) i rupe **unutar iste kriške**. Nikad ne krade pod strukturi.

**Orijentacija:** slobodna, bira se **čisto za gustoću** (npr. 4 polegnuta ili 1 uspravan + nešto gore — što god više napuni), uz fizičko ograničenje artikla (visoki frižider ne smije leći). Bez estetske sklonosti.

**Utovar/upute:** redoslijed koraka = **kabina→vrata, odozdo→gore** (točno kako skladištar fizički stavlja). Plan mora biti složiv u jednom prolazu — ništa se ne gura iza već složenog.

**Algoritam (skica):** obradi kupce redom; svaki kupac se gusto složi u pojas `[granica, vrata]` (struktura na pod pa filer u tavan te kriške); pomakni granicu na najdublji komad tog kupca; nastavi sljedećeg. Deterministički jedan prolaz (bez „vreće strategija"); minimalna principijelna pretraga tek ako screenshot pokaže lažni „ne stane".

### Metodologija procjene
- **Procjenjuje se CIJELA narudžba** (motor pakira sve odjednom; klizač „korak po korak" je samo repriza rezultata).
- **Screenshot-driven:** korisnik šalje slike loših rezultata → svaki postaje test-scenarij s očekivanjem.

## 2. Mjerilo (evaluacija) — TODO
- Ocjena rasporeda: valjanost (sva tvrda pravila), % iskorištenosti, broj utovarenih, broj pomicanja.

## 3. Test-scenariji — TODO
- Stvarni utovari (uklj. prave artikle iz Excela) na kojima se mjeri napredak.

## 4. Algoritam — iteracije — TODO
- Trenutno: greedy (extreme-points + AABB). Ideje: bolje bodovanje pozicija, više orijentacija, lokalno pretraživanje / više varijanti → najbolja.
