-- The Ascent — ranking table.
--
-- Paste this into the Supabase SQL editor once, then fill SUPABASE_URL and
-- SUPABASE_ANON_KEY into src/backend.js.

create table if not exists public.climbers (
  id          uuid primary key,
  username    text not null,
  total_ms    bigint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Keeps the ranking honest: the client is not trusted to send a sane figure,
  -- and a negative or absurd total would sit at the top of the board forever.
  constraint total_ms_sane check (total_ms >= 0 and total_ms < 315360000000)
);

-- Names are unique regardless of case, so "sisyphus" cannot shadow "Sisyphus".
create unique index if not exists climbers_username_key
  on public.climbers (lower(username));

-- The ranking's only query: order by time, longest first.
create index if not exists climbers_total_ms_idx
  on public.climbers (total_ms desc);

alter table public.climbers enable row level security;

-- Anyone may read the board — that is the point of it.
drop policy if exists climbers_read on public.climbers;
create policy climbers_read on public.climbers
  for select using (true);

-- Anyone may claim a row. There is no sign-in, by design (see storage.js), so
-- the device id is the only key there is.
drop policy if exists climbers_insert on public.climbers;
create policy climbers_insert on public.climbers
  for insert with check (true);

-- Updates are allowed, but a total may only ever go up — except to zero, which
-- is what forfeiting at the Toll does. Without this, anyone who read the anon
-- key out of the app bundle could rewrite someone else's total downward.
drop policy if exists climbers_update on public.climbers;
create policy climbers_update on public.climbers
  for update using (true)
  with check (total_ms >= 0);

create or replace function public.climbers_guard()
returns trigger language plpgsql as $$
begin
  if new.total_ms < old.total_ms and new.total_ms <> 0 then
    raise exception 'total_ms may not decrease';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists climbers_guard_trg on public.climbers;
create trigger climbers_guard_trg
  before update on public.climbers
  for each row execute function public.climbers_guard();
