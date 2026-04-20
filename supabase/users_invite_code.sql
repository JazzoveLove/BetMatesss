-- Uruchom w Supabase → SQL Editor (po tabeli public.users).
-- Dodaje krótki kod zaproszenia + bezpieczne wyszukanie po kodzie (RPC).

alter table public.users add column if not exists invite_code text;

create unique index if not exists users_invite_code_lower_key
  on public.users (lower(trim(invite_code)))
  where invite_code is not null and length(trim(invite_code)) > 0;

-- Zwraca użytkownika po kodzie (bez ujawniania całej tabeli przez RLS).
create or replace function public.lookup_user_by_invite_code(p_code text)
returns table (user_id uuid, user_nick text)
language sql
security definer
set search_path = public
stable
as $$
  select u.id, u.nick
  from public.users u
  where u.invite_code is not null
    and length(trim(u.invite_code)) > 0
    and lower(trim(u.invite_code)) = lower(trim(p_code))
  limit 1;
$$;

revoke all on function public.lookup_user_by_invite_code(text) from public;
grant execute on function public.lookup_user_by_invite_code(text) to authenticated;

-- Czy profil (public.users) istnieje — omija RLS na SELECT innych wierszy.
-- Bez tego zaproszenie z linkiem kończy się fałszywym „konto nie istnieje”.
create or replace function public.user_exists_for_friend_invite(p_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.users u where u.id = p_id);
$$;

revoke all on function public.user_exists_for_friend_invite(uuid) from public;
grant execute on function public.user_exists_for_friend_invite(uuid) to authenticated;

-- Jeśli aplikacja nie zapisuje kodu (błąd RLS przy UPDATE users), dopisz politykę
-- aktualizacji własnego wiersza, np.:
-- create policy "users_update_own" on public.users
--     for update using (auth.uid() = id) with check (auth.uid() = id);
-- (pomiń, jeśli taka polityka już istnieje — unikaj duplikatów nazw.)
