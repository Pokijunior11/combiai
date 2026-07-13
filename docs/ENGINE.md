# CombiAI — Motor slaganja (Kolosijek B)

> Cilj: složiti robu tako da **što više stane** i da je **fizički ispravno/stabilno**, uz poštovanje istovara (LIFO).
> Pristup: **Pravilnik → Mjerilo → Test-scenariji → Iteracija algoritma** (svaka promjena se mjeri).

## STATUS (gdje smo stali)
- ✅ Dijagnoza gotova (sekcija 1.4): male stvari (mikrovalne) idu na POD umjesto na VRH → lažni „ne stane".
- ✅ Mjerilo spremno: `node tools/packer-bench.mjs` reproducira sve slučajeve (CASE-1a/1b/3/4 + REF).
- ⏳ Popravak NIJE uveden. (Probni pristup — „dvije faze: struktura na pod, fileri na vrh" + ocjena po volumenu — je radio na CASE-1b, ali je povećao pomicanja; vraćen jer je korisnik htio krenuti čišće.)
- ▶️ **Sljedeći korak:** uvesti popravak PAŽLJIVO, uz mjerenje na `packer-bench` (motor je u `app/src/lib/packer.js`). Ideja koja je obećavala: probati i „fileri na pod" i „fileri na vrh" pa izabrati po (max volumen, pa min pomicanja) — najbolje od oba.

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
- Polegnuti frižider: fiksno 4 u vis; ne razmatra uspravljanje da npr. sušilica dođe gore.

### Metodologija procjene
- **Procjenjuje se CIJELA narudžba** (motor pakira sve odjednom; klizač „korak po korak" je samo repriza rezultata).
- **Screenshot-driven:** korisnik šalje slike loših rezultata → svaki postaje test-scenarij s očekivanjem.

## 2. Mjerilo (evaluacija) — TODO
- Ocjena rasporeda: valjanost (sva tvrda pravila), % iskorištenosti, broj utovarenih, broj pomicanja.

## 3. Test-scenariji — TODO
- Stvarni utovari (uklj. prave artikle iz Excela) na kojima se mjeri napredak.

## 4. Algoritam — iteracije — TODO
- Trenutno: greedy (extreme-points + AABB). Ideje: bolje bodovanje pozicija, više orijentacija, lokalno pretraživanje / više varijanti → najbolja.
