-- Uruchom w Supabase → SQL Editor (jednorazowo).
-- Dodaje brakujące polityki RLS dla tabeli public.users.

-- Każdy zalogowany użytkownik może odczytać podstawowe dane profilu
-- (id, nick, avatar_url) dowolnego innego użytkownika.
-- Jest to potrzebne do wyświetlania nicków znajomych, wyników zakładów itp.
create policy "users_select_authenticated"
  on public.users for select
  to authenticated
  using (true);

-- Każdy użytkownik może edytować tylko swój własny wiersz.
-- (pomiń tę część jeśli polityka "users_update_own" już istnieje w Supabase)
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
