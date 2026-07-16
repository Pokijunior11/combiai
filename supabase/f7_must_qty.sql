-- ============================================================
-- CombiAI — „mora u kombi" + KOLIČINA po stavci (prioritet, podatkovni sloj)
-- Pokreni u Supabase: SQL Editor -> New query -> zalijepi -> Run.
-- Sigurno za višekratno pokretanje.
--
-- must_qty = koliko komada te stavke MORA stati u kombi (0 = nije obavezno).
-- Čist podatak, neovisan o motoru slaganja; motor ga (za sad) NE forsira.
-- Ograničenje 0..qty čuva se u aplikaciji (UI klampa), ne u bazi, jer qty
-- može biti uređen zasebno.
-- ============================================================

alter table public.order_item
  add column if not exists must_qty int not null default 0 check (must_qty >= 0);
