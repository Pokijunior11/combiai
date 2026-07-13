-- ============================================================
-- CombiAI — Faza 3: narudžbe (orders + order_customer + order_item)
-- Pokreni u Supabase: SQL Editor -> New query -> zalijepi -> Run.
-- Sigurno za višekratno pokretanje.
--
-- Model:
--   orders          = jedna narudžba / planirani utovar (ime, koji kombi)
--   order_customer  = kupac unutar narudžbe (naziv, boja, position = redoslijed
--                     utovara; 0 = uz kabinu). Istovar je obrnut.
--   order_item      = stavka (koliko kojeg artikla za tog kupca)
-- Napomena: "order" je rezervirana riječ u SQL-u, zato tablica ima naziv "orders".
-- ============================================================

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  vehicle_id  uuid        references public.vehicle(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.order_customer (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid        not null references public.orders(id) on delete cascade,
  name        text        not null,
  color       text        not null default '#888888',
  position    int         not null default 0,   -- redoslijed utovara (0 = uz kabinu)
  created_at  timestamptz not null default now()
);

create table if not exists public.order_item (
  id                 uuid primary key default gen_random_uuid(),
  order_customer_id  uuid not null references public.order_customer(id) on delete cascade,
  article_id         uuid not null references public.article(id) on delete restrict,
  qty                int  not null default 1 check (qty > 0)
);

-- brži dohvat
create index if not exists idx_order_customer_order on public.order_customer(order_id);
create index if not exists idx_order_item_customer  on public.order_item(order_customer_id);

-- ---------- PRISTUP (RLS) — V1 otvoreno za anon (dogovor P6) ----------
alter table public.orders          enable row level security;
alter table public.order_customer  enable row level security;
alter table public.order_item      enable row level security;

drop policy if exists "v1 open orders" on public.orders;
create policy "v1 open orders" on public.orders
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "v1 open order_customer" on public.order_customer;
create policy "v1 open order_customer" on public.order_customer
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "v1 open order_item" on public.order_item;
create policy "v1 open order_item" on public.order_item
  for all to anon, authenticated using (true) with check (true);
