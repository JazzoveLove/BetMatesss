-- Uruchom w Supabase → SQL Editor (jednorazowo).
-- Dodaje brakujące polityki RLS dla tabel: notifications, settlements.

-- ─── notifications ────────────────────────────────────────────────────────────

alter table public.notifications enable row level security;

-- Każdy zalogowany użytkownik może wysłać notyfikację do dowolnego użytkownika
-- (np. zaproszenie do zakładu, powiadomienie o wyniku).
create policy "notifications_insert_authenticated"
  on public.notifications for insert
  to authenticated
  with check (true);

-- Użytkownik widzi tylko swoje własne notyfikacje.
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Użytkownik może zaktualizować (np. oznaczyć jako przeczytane) tylko swoje.
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ─── settlements ──────────────────────────────────────────────────────────────

alter table public.settlements enable row level security;

-- Tylko uczestnik zakładu może wstawić rozliczenie dla tego zakładu.
create policy "settlements_insert_participant"
  on public.settlements for insert
  to authenticated
  with check (
    exists (
      select 1 from public.bet_participants
      where bet_participants.bet_id = settlements.bet_id
        and bet_participants.user_id = auth.uid()
    )
  );

-- Użytkownik widzi rozliczenia, w których jest dłużnikiem lub wierzycielem.
create policy "settlements_select_participant"
  on public.settlements for select
  using (
    auth.uid() = debtor_id or auth.uid() = creditor_id
  );

-- Tylko dłużnik może oznaczyć rozliczenie jako zapłacone (paid / paid_at).
create policy "settlements_update_debtor"
  on public.settlements for update
  to authenticated
  using (auth.uid() = debtor_id)
  with check (auth.uid() = debtor_id);
