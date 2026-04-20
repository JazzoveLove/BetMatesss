-- Jednorazowy patch dla baz, które miały już stare polityki.
-- Uruchom w Supabase → SQL Editor.

-- bet_results: drugi gracz może potwierdzić wynik
drop policy if exists "bet_results_update_confirmer" on public.bet_results;
create policy "bet_results_update_confirmer"
  on public.bet_results for update
  using (
    auth.uid() <> recorded_by
    and exists (
      select 1 from public.bet_participants
      where bet_participants.bet_id = bet_results.bet_id
        and bet_participants.user_id = auth.uid()
    )
  )
  with check (
    confirmed = true
    and confirmed_by = auth.uid()
  );

-- settlements: tylko dłużnik aktualizuje (np. paid)
drop policy if exists "settlements_update_participant" on public.settlements;
drop policy if exists "settlements_update_debtor" on public.settlements;
create policy "settlements_update_debtor"
  on public.settlements for update
  to authenticated
  using (auth.uid() = debtor_id)
  with check (auth.uid() = debtor_id);
