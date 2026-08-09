-- One-off: remove rows created while testing, including the two written
-- anonymously to demonstrate the pre-auth policy gap.
-- Run once, after 002_auth.sql.

delete from public.climbers
where username in ('Intruder', 'Sisyphus', 'Camus', 'Camus2', 'Sisy', 'Ali', 'Alireza', 'John');
