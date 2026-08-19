-- Audyt migracji (19.08.2026): supabase/migrations nie zawierało ŻADNYCH
-- instrukcji GRANT/ALTER DEFAULT PRIVILEGES na tabele — baza odtworzona
-- wyłącznie z historii migracji (np. `supabase start` od zera, disaster
-- recovery, staging) miała tabele, do których anon/authenticated/
-- service_role nie mają w ogóle SELECT/INSERT/UPDATE/DELETE, tylko
-- TRUNCATE/REFERENCES/TRIGGER/MAINTAIN. Aplikacja przestałaby działać
-- w całości na takiej bazie.
--
-- Przyczyna: te uprawnienia zostały ustawione na projekcie Supabase
-- (gdmovzmxwnoazfwzegxl) automatycznie przy tworzeniu projektu przez
-- dashboard, nigdy nie trafiły do historii migracji — dokładnie ta sama
-- klasa luki co 27 nierozliczonych migracji sprzed baseline (patrz
-- 20260810120000_baseline_schema.sql), tylko po stronie uprawnień, nie
-- schematu.
--
-- Treść poniżej to dosłowny fragment `supabase db dump --linked --schema
-- public` z produkcji (GRANT-y na tabele + ALTER DEFAULT PRIVILEGES dla
-- przyszłych obiektów tworzonych przez rolę postgres). Pominięto GRANT
-- USAGE ON SCHEMA public (już nadane niezależnie od migracji przez CLI/
-- platformę, potwierdzone lokalnie) oraz GRANT/REVOKE na funkcjach (każda
-- funkcja ma je już zapisane przy sobie, w swoim pliku migracji).
--
-- payments i settlements celowo mają węższy zestaw niż reszta tabel — to
-- odzwierciedla istniejący projekt (payments: soft-delete tylko przez
-- delete_payment() SECURITY DEFINER, stąd brak UPDATE/DELETE bezpośrednio
-- dla anon/authenticated; settlements: brak UPDATE, jest bezpośredni
-- DELETE).

grant all on table public.bet_participants to anon;
grant all on table public.bet_participants to authenticated;
grant all on table public.bet_participants to service_role;

grant all on table public.bet_results to anon;
grant all on table public.bet_results to authenticated;
grant all on table public.bet_results to service_role;

grant all on table public.bets to anon;
grant all on table public.bets to authenticated;
grant all on table public.bets to service_role;

grant all on table public.friendships to anon;
grant all on table public.friendships to authenticated;
grant all on table public.friendships to service_role;

grant all on table public.notifications to anon;
grant all on table public.notifications to authenticated;
grant all on table public.notifications to service_role;

grant select, insert, references, trigger, truncate, maintain on table public.payments to anon;
grant select, insert, references, trigger, truncate, maintain on table public.payments to authenticated;
grant all on table public.payments to service_role;

grant select, insert, references, delete, trigger, truncate, maintain on table public.settlements to anon;
grant select, insert, references, delete, trigger, truncate, maintain on table public.settlements to authenticated;
grant all on table public.settlements to service_role;

grant all on table public.users to anon;
grant all on table public.users to authenticated;
grant all on table public.users to service_role;

alter default privileges for role postgres in schema public grant all on sequences to postgres;
alter default privileges for role postgres in schema public grant all on sequences to anon;
alter default privileges for role postgres in schema public grant all on sequences to authenticated;
alter default privileges for role postgres in schema public grant all on sequences to service_role;

alter default privileges for role postgres in schema public grant all on functions to postgres;
alter default privileges for role postgres in schema public grant all on functions to anon;
alter default privileges for role postgres in schema public grant all on functions to authenticated;
alter default privileges for role postgres in schema public grant all on functions to service_role;

alter default privileges for role postgres in schema public grant all on tables to postgres;
alter default privileges for role postgres in schema public grant all on tables to anon;
alter default privileges for role postgres in schema public grant all on tables to authenticated;
alter default privileges for role postgres in schema public grant all on tables to service_role;
