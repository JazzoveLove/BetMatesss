-- Jedno zapytanie SQL łączące WSZYSTKIE dane ekranu "Bilanse". Zastępuje
-- sklejanie po stronie JS, które było w DWÓCH miejscach i w obu miało ten sam
-- błąd:
--   * src/features/balances/api/balances.queries.ts (getBalancesScreenData)
--   * src/features/bets/api/bets.queries.ts       (getFriendsBalanceLeaderboard)
-- Oba iterowały po liście ZNAJOMYCH i doklejały saldo/mecze przez słownik
-- (`balanceById.get(id) ?? 0`). Skutek: saldo z osobą, która usunęła konto lub
-- została usunięta ze znajomych (wiersz w friendships skasowany), znikało bez
-- śladu i bez błędu — mimo że nadal istnieje w settlements/payments.
--
-- DLACZEGO UNIA, A NIE JOIN OD JEDNEJ TABELI:
-- kompletny zbiór kontrahentów to UNIA trzech niezależnych źródeł, z których
-- każde może zawierać kogoś, kogo nie ma w pozostałych:
--   1. friendships (accepted, w dowolną stronę)      — aktywni znajomi
--   2. CTE `bal` (settlements ∪ payments)            — ktoś, komu coś wisisz /
--      kto wisi tobie, niezależnie od statusu znajomości
--   3. CTE `mc` (wspólne, potwierdzone mecze)        — historia gry bez salda
-- Gdyby zacząć od `friendships` i doJOINować resztę (albo — co gorsza — zrobić
-- to w pętli JS po liście znajomych), wiersz istniejący TYLKO w źródle 2 lub 3
-- wypada. UNION gwarantuje kompletność przez samą definicję. Ten sam wzorzec co
-- get_pending_actions (UNION wielu gałęzi zamiast pętli po jednej liście w JS).
--
-- LOGIKA SALDA I LICZBY MECZÓW jest przeniesiona 1:1 (jako CTE) z:
--   * 20260814120000_add_get_balances_with_friends.sql   (settle/pay/bal)
--   * 20260823120000_add_get_match_counts_with_friends.sql (mc)
-- bez żadnej zmiany. Tamte funkcje zostają — ta je tylko konsoliduje z
-- friendships i users w jednym wywołaniu.
--
-- INVOKER (bez security definer) — użytkownik czyta wyłącznie dane o sobie, RLS
-- na friendships/settlements/payments/bet_*/users działa normalnie. Ten sam
-- wzorzec co get_pending_actions / get_balances_with_friends / get_pair_balance.
-- Każdy other_id w wyniku spełnia can_see_user (jest znajomym albo
-- współuczestnikiem zakładu — payments_insert i settlements_insert tego
-- pilnują), więc LEFT JOIN do users się rozwiązuje. Gdyby jednak nie —
-- wiersz i tak zostaje (nick NULL), a warstwa JS podłoży etykietę zastępczą:
-- fail-open na profilu, kompletność zbioru gwarantuje SQL.
--
-- deleted_at zwracamy surowo (obok nicka) — mapowanie na "Usunięty użytkownik"
-- robi warstwa prezentacji, tak jak w getPairDetail.

create or replace function public.get_balances_screen_data(p_viewer uuid)
 returns table (
   other_id uuid,
   nick text,
   avatar_url text,
   is_friend boolean,
   deleted_at timestamptz,
   balance integer,
   match_count integer
 )
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
  with settle as (
    select
      case when creditor_id = p_viewer then debtor_id else creditor_id end as other_id,
      case when creditor_id = p_viewer then amount else -amount end as delta
    from public.settlements
    where creditor_id = p_viewer or debtor_id = p_viewer
  ),
  pay as (
    select
      case when from_user = p_viewer then to_user else from_user end as other_id,
      case when from_user = p_viewer then amount else -amount end as delta
    from public.payments
    where (from_user = p_viewer or to_user = p_viewer)
      and deleted_at is null
  ),
  bal as (
    select t.other_id, sum(t.delta)::integer as balance
    from (select * from settle union all select * from pay) t
    group by t.other_id
  ),
  mc as (
    select bp_o.user_id as other_id, count(*)::integer as match_count
    from public.bet_results r
    join public.bets b on b.id = r.bet_id
    join public.bet_participants bp_v on bp_v.bet_id = b.id and bp_v.user_id = p_viewer
    join public.bet_participants bp_o on bp_o.bet_id = b.id and bp_o.user_id <> p_viewer
    where r.confirmed = true
      and b.format <> 'per_match'
      and r.winner_id in (p_viewer, bp_o.user_id)
    group by bp_o.user_id
  ),
  fr as (
    select distinct
      case when user_a = p_viewer then user_b else user_a end as other_id
    from public.friendships
    where status = 'accepted'
      and (user_a = p_viewer or user_b = p_viewer)
  ),
  ids as (
    select fr.other_id from fr
    union
    select bal.other_id from bal
    union
    select mc.other_id from mc
  )
  select
    i.other_id                    as other_id,
    u.nick                        as nick,
    u.avatar_url                  as avatar_url,
    (fr.other_id is not null)     as is_friend,
    u.deleted_at                  as deleted_at,
    coalesce(bal.balance, 0)      as balance,
    coalesce(mc.match_count, 0)   as match_count
  from ids i
  left join fr            on fr.other_id  = i.other_id
  left join bal           on bal.other_id = i.other_id
  left join mc            on mc.other_id  = i.other_id
  left join public.users u on u.id        = i.other_id
  where i.other_id is not null
    and i.other_id <> p_viewer
  order by i.other_id;
$function$;

revoke all on function public.get_balances_screen_data(uuid) from public;
revoke all on function public.get_balances_screen_data(uuid) from anon;
grant execute on function public.get_balances_screen_data(uuid) to authenticated;
