-- P1-1 (audyt 15.08.2026): prevent_bets_protected_field_change chronił tylko
-- creator_id/stake_mode/format — status mógł zostać ustawiony na dowolną
-- wartość przez każdego uczestnika/twórcę bezpośrednim wywołaniem API,
-- z pominięciem całego flow (confirmParticipation / submit_bet_result /
-- confirmBetResult / disputeBetResult / cancelDisputedBet).
--
-- Najgorszy przypadek: uczestnik ustawia active/awaiting_confirmation
-- wprost na 'completed', z pominięciem confirmBetResult — jedynego miejsca,
-- które woła createSettlements. Zakład znika z listy aktywnych jako
-- rzekomo zamknięty, ale żadne rozliczenie nigdy nie powstaje — realny
-- sposób na zatuszowanie nierozliczonej stawki.
--
-- Fix: biała lista dozwolonych przejść statusu (odwzorowuje dokładnie to,
-- co dziś wymuszają .eq('status', ...) w kodzie aplikacji, patrz
-- bets.participants.ts, bets.resolve.results.ts, delete_my_account), plus
-- dodatkowy warunek, że przejście do 'completed' wymaga istnienia
-- potwierdzonego bet_results — zamyka scenariusz z akapitu wyżej także
-- wtedy, gdy zakład już jest w 'awaiting_confirmation'.

create or replace function public.prevent_bets_protected_field_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.creator_id is distinct from old.creator_id
     or new.stake_mode is distinct from old.stake_mode
     or new.format is distinct from old.format then
    raise exception 'Nie można zmieniać creator_id/stake_mode/format po utworzeniu zakładu';
  end if;

  if new.status is distinct from old.status then
    if (old.status, new.status) not in (
      ('pending', 'active'),
      ('pending', 'rejected'),
      ('active', 'awaiting_confirmation'),
      ('awaiting_confirmation', 'completed'),
      ('awaiting_confirmation', 'disputed'),
      ('disputed', 'cancelled'),
      ('active', 'cancelled'),
      ('awaiting_confirmation', 'cancelled')
    ) then
      raise exception 'Niedozwolone przejście statusu zakładu: % -> %', old.status, new.status;
    end if;

    if new.status = 'completed' and not exists (
      select 1 from public.bet_results r
      where r.bet_id = new.id and r.confirmed = true
    ) then
      raise exception 'Nie można oznaczyć zakładu jako ukończony bez potwierdzonego wyniku';
    end if;
  end if;

  return new;
end;
$function$;
