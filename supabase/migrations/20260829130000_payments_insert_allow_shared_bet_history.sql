-- BŁĄD-2 (KROK 2.5a): dług z osobą spoza listy znajomych jest widoczny na
-- ekranie Bilanse (po naprawie BŁĘDU-1), przycisk "Rozlicz" też — ale INSERT do
-- payments jest odrzucany przez RLS, bo payments_insert wymaga dziś AKTYWNEJ
-- znajomości:
--
--     ... and exists (
--       select 1 from public.friendships f
--       where f.status = 'accepted' and (
--         (f.user_a = payments.from_user and f.user_b = payments.to_user)
--         or (f.user_a = payments.to_user and f.user_b = payments.from_user)
--       )
--     )
--
-- Skutek: użytkownik widzi zobowiązanie, którego nie może zamknąć. Po usunięciu
-- konta wiersz w friendships jest kasowany (delete_my_account), a po usunięciu
-- ze znajomych — również. Samo zobowiązanie (settlements/payments/bet_results)
-- zostaje.
--
-- Naprawa: ostatni warunek dopuszcza ALTERNATYWNIE wspólną historię zakładów,
-- odwzorowując drugi człon can_see_user (20260819120000):
--
--     or exists (
--       select 1
--       from public.bet_participants a
--       join public.bet_participants b on b.bet_id = a.bet_id
--       where a.user_id = payments.from_user and b.user_id = payments.to_user
--     )
--
-- Zasada: jeśli coś pokazujemy użytkownikowi, musi mieć czym na to zareagować —
-- widoczność (can_see_user: znajomość LUB wspólny bet_participants) i możliwość
-- działania (payments_insert) opierają się teraz na tej samej regule.
--
-- Dlaczego to bezpieczne bez security definer: pozostałe (niezmienione) warunki
-- wymagają, żeby wstawiający był stroną płatności ((select auth.uid()) =
-- created_by oraz = from_user lub to_user). Podzapytanie po bet_participants
-- działa w kontekście wstawiającego, więc podlega RLS bet_participants_select
-- (is_bet_participant(bet_id, auth.uid())) — ale skoro wstawiający jest jedną ze
-- stron, a szukamy zakładu, w którym uczestniczą OBIE strony, to kwalifikujący
-- się zakład ma wstawiającego jako uczestnika i jego wiersze są dla niego
-- widoczne. Ten sam wzorzec inline-EXISTS na bet_* co w settlements_insert.
--
-- Bez zmian: created_by = auth.uid(), bycie jedną ze stron, forma
-- (select auth.uid()) (InitPlan, 20260818100400). Zmienia się wyłącznie ostatni
-- człon `and (... or ...)`.

drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments for insert
with check (
  (select auth.uid()) = created_by
  and ((select auth.uid()) = from_user or (select auth.uid()) = to_user)
  and (
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.user_a = payments.from_user and f.user_b = payments.to_user)
          or (f.user_a = payments.to_user and f.user_b = payments.from_user)
        )
    )
    or exists (
      select 1
      from public.bet_participants a
      join public.bet_participants b on b.bet_id = a.bet_id
      where a.user_id = payments.from_user
        and b.user_id = payments.to_user
    )
  )
);
