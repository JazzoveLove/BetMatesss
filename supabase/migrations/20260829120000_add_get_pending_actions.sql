-- Zagregowana lista spraw czekających na decyzję użytkownika — dla sekcji
-- "Wymaga akcji" na Home i ekranu "Sprawy" (KROK 3a). Nie wymaga nowych tabel:
-- trzy typy spraw mapują się na istniejące kolumny.
--
--   bet_invite     — zaproszenie do zakładu, na które p_viewer nie odpowiedział:
--                      bet_participants.user_id = p_viewer AND confirmed = false
--                      AND bets.status = 'pending'
--                    Źródłem prawdy jest bet_participants, NIE tabela
--                    notifications — powiadomienie może zostać odczytane/usunięte
--                    niezależnie od faktycznego stanu zaproszenia.
--
--   result_confirm — ktoś wpisał wynik, p_viewer ma potwierdzić lub zgłosić spór:
--                      bets.status = 'awaiting_confirmation'
--                      AND bet_results.confirmed = false
--                      AND bet_results.recorded_by <> p_viewer
--                      AND p_viewer jest uczestnikiem
--                    Warunek recorded_by <> p_viewer jest kluczowy: osoba, która
--                    wpisała wynik, nie ma czego potwierdzać.
--
--   dispute        — zakład w sporze: bets.status = 'disputed'
--                      AND p_viewer jest uczestnikiem
--
-- INVOKER (bez security definer) — użytkownik czyta wyłącznie własne sprawy,
-- RLS na bets / bet_participants / bet_results ma zadziałać normalnie. Ten sam
-- wzorzec co get_pair_balance / get_pair_stats / get_balances_with_friends /
-- get_match_counts_with_friends.
--
-- JEDNA SPRAWA = JEDEN WIERSZ. Statusy bets się wykluczają
-- (pending / awaiting_confirmation / disputed), więc dany zakład trafia
-- dokładnie do jednej gałęzi UNION. distinct on (bet_id) zabezpiecza wyłącznie
-- przed zwielokrotnieniem wiersza przy > 2 uczestnikach — other_id to wtedy
-- dowolny inny uczestnik (UI i tak pokazuje nazwę zakładu, nie osobę).
--
-- created_at = moment powstania SPRAWY, nie zawsze moment utworzenia zakładu:
--   bet_invite / dispute → bets.created_at (brak lepszego sygnału; nie ma
--                          kolumny disputed_at)
--   result_confirm       → bet_results.created_at (sprawa powstaje z chwilą
--                          wpisania wyniku, nie utworzenia zakładu)
-- Sortowanie: created_at DESC, NULL na końcu (kolumny created_at są
-- timestamptz DEFAULT now() bez NOT NULL, więc teoretyczny NULL nie może
-- wylądować na górze listy "wymaga akcji").

create or replace function public.get_pending_actions(p_viewer uuid)
 returns table (
   kind text,
   bet_id uuid,
   other_id uuid,
   game_template text,
   stake numeric,
   created_at timestamptz
 )
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
  select dedup.kind, dedup.bet_id, dedup.other_id,
         dedup.game_template, dedup.stake, dedup.created_at
  from (
    select distinct on (u.bet_id) u.*
    from (
      -- 1. bet_invite — niepotwierdzony udział p_viewera w zakładzie 'pending'
      select
        'bet_invite'::text as kind,
        b.id               as bet_id,
        bp_other.user_id   as other_id,
        b.game_template    as game_template,
        b.stake_per_match  as stake,
        b.created_at       as created_at
      from public.bets b
      join public.bet_participants bp_me
        on bp_me.bet_id = b.id
       and bp_me.user_id = p_viewer
       and bp_me.confirmed = false
      left join public.bet_participants bp_other
        on bp_other.bet_id = b.id
       and bp_other.user_id <> p_viewer
      where b.status = 'pending'

      union all

      -- 2. result_confirm — cudzy, niepotwierdzony wynik do decyzji p_viewera
      select
        'result_confirm'::text as kind,
        b.id                   as bet_id,
        bp_other.user_id       as other_id,
        b.game_template        as game_template,
        b.stake_per_match      as stake,
        r.created_at           as created_at
      from public.bets b
      join public.bet_results r
        on r.bet_id = b.id
       and r.confirmed = false
       and r.recorded_by <> p_viewer
      join public.bet_participants bp_me
        on bp_me.bet_id = b.id
       and bp_me.user_id = p_viewer
      left join public.bet_participants bp_other
        on bp_other.bet_id = b.id
       and bp_other.user_id <> p_viewer
      where b.status = 'awaiting_confirmation'

      union all

      -- 3. dispute — zakład w sporze, w którym p_viewer bierze udział
      select
        'dispute'::text   as kind,
        b.id              as bet_id,
        bp_other.user_id  as other_id,
        b.game_template   as game_template,
        b.stake_per_match as stake,
        b.created_at      as created_at
      from public.bets b
      join public.bet_participants bp_me
        on bp_me.bet_id = b.id
       and bp_me.user_id = p_viewer
      left join public.bet_participants bp_other
        on bp_other.bet_id = b.id
       and bp_other.user_id <> p_viewer
      where b.status = 'disputed'
    ) u
    order by u.bet_id, u.other_id nulls last
  ) dedup
  order by dedup.created_at desc nulls last, dedup.bet_id;
$function$;

revoke all on function public.get_pending_actions(uuid) from public;
revoke all on function public.get_pending_actions(uuid) from anon;
grant execute on function public.get_pending_actions(uuid) to authenticated;
