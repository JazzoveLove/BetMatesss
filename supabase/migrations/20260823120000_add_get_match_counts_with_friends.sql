-- Uogólnienie get_pair_stats na wszystkich kontrahentów naraz, analogicznie do
-- get_balances_with_friends/get_pair_balance (patrz 20260814120000). Ekran
-- "Bilanse" potrzebuje liczby wspólnych, potwierdzonych meczów per znajomy —
-- bez rozbicia na dyscypliny, więc sumujemy wins+losses z get_pair_stats w
-- jedno match_count na wiersz.

create or replace function public.get_match_counts_with_friends(p_viewer uuid)
 returns table (other_id uuid, match_count integer)
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
  select bp_o.user_id as other_id, count(*)::integer as match_count
  from public.bet_results r
  join public.bets b on b.id = r.bet_id
  join public.bet_participants bp_v on bp_v.bet_id = b.id and bp_v.user_id = p_viewer
  join public.bet_participants bp_o on bp_o.bet_id = b.id and bp_o.user_id <> p_viewer
  where r.confirmed = true
    and b.format <> 'per_match'
    and r.winner_id in (p_viewer, bp_o.user_id)
  group by bp_o.user_id;
$function$;

revoke all on function public.get_match_counts_with_friends(uuid) from public;
revoke all on function public.get_match_counts_with_friends(uuid) from anon;
grant execute on function public.get_match_counts_with_friends(uuid) to authenticated;
