-- Move the ranking onto authenticated identities.
-- Run after schema.sql. Existing device-keyed rows are left in place; they are
-- readable but no longer writable by anyone.

alter table public.climbers
  add column if not exists email_verified boolean not null default true;

-- Only a signed-in user may create or change their own row. This replaces the
-- open policies from schema.sql, where the shared anon key was the only key.
drop policy if exists climbers_insert on public.climbers;
create policy climbers_insert on public.climbers
  for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists climbers_update on public.climbers;
create policy climbers_update on public.climbers
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and total_ms >= 0);

-- Reading stays public: the board is the point.
drop policy if exists climbers_read on public.climbers;
create policy climbers_read on public.climbers
  for select using (true);
