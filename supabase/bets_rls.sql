-- Uruchom w Supabase → SQL Editor, gdy na `public.bets` jest już włączone RLS.
-- Realtime (postgres_changes) wysyła zdarzenia tylko użytkownikom, którzy mają SELECT na dany wiersz.
-- Jeśli drugi gracz nie dostaje eventów z `bets`, brakuje mu polityki SELECT — poniżej typowy wzorzec.

-- Twórca lub uczestnik zakładu widzi wiersz.
create policy "bets_select_creator_or_participant"
  on public.bets for select
  to authenticated
  using (
    auth.uid() = creator_id
    or exists (
      select 1 from public.bet_participants bp
      where bp.bet_id = bets.id
        and bp.user_id = auth.uid()
    )
  );
