-- Uruchom w Supabase → SQL Editor (jednorazowo).
-- Dodaje polityki RLS dla tabeli public.bet_results.

alter table public.bet_results enable row level security;

-- Użytkownik może zobaczyć wyniki zakładów, w których uczestniczy.
create policy "bet_results_select_participant"
  on public.bet_results for select
  using (
    auth.uid() = recorded_by
    or exists (
      select 1 from public.bet_participants
      where bet_participants.bet_id = bet_results.bet_id
        and bet_participants.user_id = auth.uid()
    )
  );

-- Tylko uczestnik zakładu może wpisać wynik (recorded_by musi być zalogowanym użytkownikiem).
create policy "bet_results_insert_participant"
  on public.bet_results for insert
  with check (
    auth.uid() = recorded_by
    and exists (
      select 1 from public.bet_participants
      where bet_participants.bet_id = bet_results.bet_id
        and bet_participants.user_id = auth.uid()
    )
  );

-- Tylko osoba, która wpisała wynik, może go zaktualizować.
create policy "bet_results_update_recorder"
  on public.bet_results for update
  using (auth.uid() = recorded_by);
