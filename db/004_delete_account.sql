-- Account deletion, required by both stores for any app with accounts.
-- Run after 002_auth.sql.
--
-- Deleting an auth user needs privileges the app will never have, so this is a
-- SECURITY DEFINER function scoped to the caller: it can only ever delete the
-- row and the user matching auth.uid(), never anyone else's.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  delete from public.climbers where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- Deleting the row directly is still not allowed; the function is the only way,
-- which keeps the ranking safe from a client that simply calls DELETE.
