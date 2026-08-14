-- Uogólnienie get_pair_balance na wszystkich kontrahentów naraz (ta sama logika
-- znaków: settlements liczone wprost, payments liczone tak samo jak w
-- get_pair_balance — patrz 20260810120000_baseline_schema.sql).
-- getDashboardData i getFriendsBalanceLeaderboard liczyły saldo wyłącznie z
-- settlements, ignorując payments — po "Rozlicz" saldo na Dashboardzie i w
-- rankingu znajomych zostawało nieaktualne mimo że FriendDetail (przez
-- get_pair_balance) już pokazywał 0.

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
  )
  select t.other_id, sum(t.delta)::integer as balance
  from (select * from s union all select * from p) t
  group by t.other_id;
$function$;

revoke all on function public.get_balances_with_friends(uuid) from public;
revoke all on function public.get_balances_with_friends(uuid) from anon;
grant execute on function public.get_balances_with_friends(uuid) to authenticated;
