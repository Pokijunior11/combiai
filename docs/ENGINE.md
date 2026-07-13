# CombiAI — Motor slaganja (Kolosijek B)

> Cilj: složiti robu tako da **što više stane** i da je **fizički ispravno/stabilno**, uz poštovanje istovara (LIFO).
> Pristup: **Pravilnik → Mjerilo → Test-scenariji → Iteracija algoritma** (svaka promjena se mjeri).

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

### 1.4 Poznati problemi trenutnog motora (test-scenariji)
- **CASE-1 (kritičan): dodavanje jedne MIKROVALNE izbaci DVA FRIŽIDERA** kao neutovarena. Apsurdno (sitno izbacuje ogromno) = lažni „ne stane" + nestabilnost pohlepnog motora. **Prvi cilj popravka.** (Reproducirati: točan sadržaj kupaca — čeka se od korisnika.)
- Polegnuti frižider: fiksno 4 u vis; ne razmatra uspravljanje da npr. sušilica dođe gore.
- Pohlepno slaganje ostavlja rupe / prevelike razmake.

### Metodologija procjene
- **Procjenjuje se CIJELA narudžba** (motor pakira sve odjednom; klizač „korak po korak" je samo repriza rezultata).
- **Screenshot-driven:** korisnik šalje slike loših rezultata → svaki postaje test-scenarij s očekivanjem.

## 2. Mjerilo (evaluacija) — TODO
- Ocjena rasporeda: valjanost (sva tvrda pravila), % iskorištenosti, broj utovarenih, broj pomicanja.

## 3. Test-scenariji — TODO
- Stvarni utovari (uklj. prave artikle iz Excela) na kojima se mjeri napredak.

## 4. Algoritam — iteracije — TODO
- Trenutno: greedy (extreme-points + AABB). Ideje: bolje bodovanje pozicija, više orijentacija, lokalno pretraživanje / više varijanti → najbolja.
