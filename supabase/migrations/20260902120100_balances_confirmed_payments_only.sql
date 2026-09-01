-- KROK 2.5b (ZADANIE 5): saldo liczy TYLKO potwierdzone płatności.
--
-- Po 20260902120000 payments ma kolumnę status ('pending' / 'confirmed' /
-- 'rejected'). Wpis dłużnika ("oddałem") jest 'pending' i NIE może wpływać
-- na bilans, dopóki wierzyciel go nie potwierdzi. Wpis odrzucony ('rejected')
-- też nie wchodzi (dług zostaje), ale wiersz nie znika — jest historią.
--
-- Wszystkie trzy funkcje, które sumują payments do jakiejkolwiek kwoty
-- pieniężnej, dostają ten sam warunek `and status = 'confirmed'` obok
-- istniejącego `and deleted_at is null`:
--   * get_pair_balance          (20260810120000_baseline_schema.sql)
--   * get_balances_with_friends (20260814120000)
--   * get_balances_screen_data  (20260901120000)
-- Reszta ciała każdej funkcji bez zmian — to jedyna modyfikacja.
-- (get_pending_actions czyta payments do NOWEGO typu sprawy 'payment_confirm',
--  ale nie do sumy — patrz 20260902120200.)

-- -------------------------------------------------------------------------
-- get_pair_balance
-- -------------------------------------------------------------------------
create or replace function public.get_pair_balance(p_viewer uuid, p_other uuid)
 returns integer
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
  select
    coalesce((
      select sum(
        case
          when s.creditor_id = p_viewer and s.debtor_id = p_other then s.amount
          when s.debtor_id = p_viewer and s.creditor_id = p_other then -s.amount
          else 0
        end
      )
      from public.settlements s
      where (s.creditor_id = p_viewer and s.debtor_id = p_other)
         or (s.debtor_id = p_viewer and s.creditor_id = p_other)
    ), 0)
    - coalesce((
      select sum(p.amount) from public.payments p
      where p.from_user = p_other and p.to_user = p_viewer
        and p.deleted_at is null and p.status = 'confirmed'
    ), 0)
    + coalesce((
      select sum(p.amount) from public.payments p
      where p.from_user = p_viewer and p.to_user = p_other
        and p.deleted_at is null and p.status = 'confirmed'
    ), 0)
$function$;

-- -------------------------------------------------------------------------
-- get_balances_with_friends
-- -------------------------------------------------------------------------
create or replace function public.get_balances_with_friends(p_viewer uuid)
 returns table (other_id uuid, balance integer)
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
  with s as (
    select
      case when creditor_id = p_viewer then debtor_id else creditor_id end as other_id,
      case when creditor_id = p_viewer then amount else -amount end as delta
    from public.settlements
    where creditor_id = p_viewer or debtor_id = p_viewer
  ),
  p as (
    select
      case when from_user = p_viewer then to_user else from_user end as other_id,
      case when from_user = p_viewer then amount else -amount end as delta
    from public.payments
    where (from_user = p_viewer or to_user = p_viewer)
      and deleted_at is null
      and status = 'confirmed'
  )
  select t.other_id, sum(t.delta)::integer as balance
  from (select * from s union all select * from p) t
  group by t.other_id;
$function$;

-- -------------------------------------------------------------------------
-- get_balances_screen_data
-- -------------------------------------------------------------------------
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
      and status = 'confirmed'
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
