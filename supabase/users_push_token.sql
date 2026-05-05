-- Dodaj kolumnę na Expo Push Token w tabeli użytkowników.
alter table public.users
  add column if not exists expo_push_token text;

-- Opcjonalny index (przydatny przy wysyłce push po tokenie).
create index if not exists users_expo_push_token_idx
  on public.users (expo_push_token)
  where expo_push_token is not null;
