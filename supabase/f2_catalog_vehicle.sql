-- ============================================================
-- CombiAI — Faza 2: katalog (article) + vozila (vehicle)
-- Pokreni u Supabase: lijevo "SQL Editor" -> "New query" -> zalijepi sve -> "Run".
-- Sigurno za višekratno pokretanje (ne duplicira seed).
--
-- JEDINICE: dimenzije u CENTIMETRIMA, težina u KG. Pohranjuje se BRUTTO
-- (zapakirano) jer se to tovari. Aplikacija cm pretvara u metre za packer.
-- Osi: length = duljina (X, kabina->vrata), width = širina (Z), height = visina (Y).
-- ============================================================

-- ---------- VOZILA ----------
create table if not exists public.vehicle (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  length_cm   numeric     not null,
  width_cm    numeric     not null,
  height_cm   numeric     not null,
  payload_kg  numeric     not null,
  created_at  timestamptz not null default now()
);

-- ---------- KATALOG ARTIKALA ----------
create table if not exists public.article (
  id          uuid primary key default gen_random_uuid(),
  code        text unique,                       -- šifra/SKU (za kasnije PrestaShop povezivanje); može biti NULL
  name        text        not null,
  length_cm   numeric     not null,              -- brutto
  width_cm    numeric     not null,              -- brutto
  height_cm   numeric     not null,              -- brutto
  weight_kg   numeric     not null,              -- brutto
  can_lie     boolean     not null default false, -- smije se položiti (npr. mali frižider)
  created_at  timestamptz not null default now()
);

-- ---------- PRISTUP (RLS) ----------
-- V1: jedan zajednički pristup preko anon ključa (dogovor P6). Otvaramo CRUD za anon.
-- KASNIJE (prave uloge): zamijeniti ove politike strožima.
alter table public.vehicle enable row level security;
alter table public.article enable row level security;

drop policy if exists "v1 open vehicle" on public.vehicle;
create policy "v1 open vehicle" on public.vehicle
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "v1 open article" on public.article;
create policy "v1 open article" on public.article
  for all to anon, authenticated using (true) with check (true);

-- ---------- SEED (samo ako su tablice prazne) ----------
do $$
begin
  if not exists (select 1 from public.vehicle) then
    insert into public.vehicle (name, length_cm, width_cm, height_cm, payload_kg)
    values ('Kombi', 400, 200, 230, 1400);
  end if;

  if not exists (select 1 from public.article) then
    insert into public.article (code, name, length_cm, width_cm, height_cm, weight_kg, can_lie) values
      ('hladnjak',  'Hladnjak',          60, 65, 185, 75, false),
      ('mfrizider', 'Mali frižider',     55, 55, 140, 38, true),
      ('zamrzivac', 'Zamrzivač škrinja', 80, 65,  85, 45, false),
      ('perilica',  'Perilica rublja',   60, 60,  85, 70, false),
      ('susilica',  'Sušilica',          60, 60,  85, 35, false),
      ('posudje',   'Perilica posuđa',   60, 60,  82, 40, false),
      ('stednjak',  'Štednjak',          60, 60,  90, 50, false),
      ('mikro',     'Mikrovalna',        50, 40,  30, 15, true);
  end if;
end $$;
