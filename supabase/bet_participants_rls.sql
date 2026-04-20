-- Uruchom w Supabase → SQL Editor (jednorazowo).
-- Dodaje polityki RLS dla tabeli public.bet_participants.

alter table public.bet_participants enable row level security;

-- Uczestnik zakładu widzi tylko swój rekord uczestnictwa.
create policy "bet_participants_select_own"
  on public.bet_participants for select
  using (auth.uid() = user_id);

-- Zalogowany użytkownik może dodać siebie jako uczestnika.
create policy "bet_participants_insert_self"
  on public.bet_participants for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Uczestnik może edytować swój rekord (np. confirmed=true).
create policy "bet_participants_update_own"
  on public.bet_participants for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Uczestnik może usunąć swój rekord.
create policy "bet_participants_delete_own"
  on public.bet_participants for delete
  using (auth.uid() = user_id);
