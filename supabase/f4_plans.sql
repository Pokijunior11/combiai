-- ============================================================
-- CombiAI — Faza 4/5: spremljeni planovi utovara (plan)
-- Pokreni u Supabase: SQL Editor -> New query -> zalijepi -> Run.
--
-- Plan je "zamrznuti" rezultat izračuna (raspored kutija, plan istovara, kombi)
-- spremljen kao JSON. Skladištar ga otvara samo za gledanje (ne preračunava se),
-- pa ostaje isti čak i ako se katalog/algoritam kasnije promijene.
-- ============================================================

create table if not exists public.plan (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid        references public.orders(id) on delete set null,
  name        text        not null,
  data        jsonb       not null,   -- snapshot: kombi + kutije + plan istovara + statistika
  created_at  timestamptz not null default now()
);

alter table public.plan enable row level security;
drop policy if exists "v1 open plan" on public.plan;
create policy "v1 open plan" on public.plan
  for all to anon, authenticated using (true) with check (true);
