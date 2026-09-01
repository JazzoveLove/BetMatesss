-- KROK 2.5b (ZADANIE 6): czwarty typ sprawy — 'payment_confirm'.
--
-- Po 20260902120000 wpis dłużnika do payments jest 'pending' i czeka na
-- decyzję wierzyciela (to_user). To sprawa "wymaga akcji" dokładnie tak jak
-- bet_invite / result_confirm / dispute, więc dokładamy ją do
-- get_pending_actions (konsument: sekcja "Wymaga akcji" na Home + ekran
-- Sprawy w KROKU 3b).
--
-- bet_id vs payment_id — DECYZJA:
-- get_pending_actions dotąd zwracało bet_id jako klucz sprawy i dedupowało
-- po nim (`distinct on (bet_id)` w SQL, `seenBetIds` w JS). Spłata NIE jest
-- przypisana do zakładu. Reużycie bet_id = NULL dla payment_confirm jest
-- pułapką: Postgres `DISTINCT ON` i JS Set traktują wszystkie NULL/te same
-- klucze jako równe, więc WSZYSTKIE wiszące spłaty zwinęłyby się do JEDNEGO
-- wiersza. Dlatego DODAJEMY osobną kolumnę payment_id uuid; bet_id zostaje
-- NULL dla tej gałęzi, payment_id NULL dla pozostałych. Klucz sprawy to
-- coalesce(bet_id, payment_id) — i tego samego wyrażenia używa wiodące
-- ORDER BY przy DISTINCT ON, oraz mapper w JS (row.bet_id ?? row.payment_id).
--
-- game_template dla payment_confirm = NULL (spłata nie ma dyscypliny) — stąd
-- typ kolumny game_template pozostaje nullowalny (RETURNS TABLE i tak nie
-- wymusza NOT NULL). stake dla payment_confirm = kwota spłaty (payments.amount)
-- — jedyny sensowny "numer sprawy" do pokazania; UI w 3b nada mu etykietę.
--
-- created_at: payments.created_at już istnieje w schemacie
-- (20260810120000_baseline_schema.sql: `created_at timestamptz not null
-- default now()`), więc nie trzeba jej dodawać — używamy jej wprost do
-- sortowania listy.
--
-- Zmiana typu zwracanego (nowa kolumna payment_id) wymaga DROP + CREATE —
-- `create or replace` odmówiłoby ("cannot change return type"). Grant/revoke
-- są per-oid i giną z funkcją, więc odtwarzamy je poniżej.
--
-- INVOKER (bez security definer) — bez zmian względem 20260829120000. Nowa
-- gałąź czyta payments pod RLS wywołującego (payments_select: auth.uid() IN
-- (from_user, to_user)); p_viewer = to_user, więc wiersz jest dla niego
-- widoczny.

drop function if exists public.get_pending_actions(uuid);

create function public.get_pending_actions(p_viewer uuid)
 returns table (
   kind text,
   bet_id uuid,
   payment_id uuid,
   other_id uuid,
   game_template text,
   stake numeric,
   created_at timestamptz
 )
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
  select dedup.kind, dedup.bet_id, dedup.payment_id, dedup.other_id,
         dedup.game_template, dedup.stake, dedup.created_at
  from (
    select distinct on (coalesce(u.bet_id, u.payment_id)) u.*
    from (
      -- 1. bet_invite — niepotwierdzony udział p_viewera w zakładzie 'pending'
      select
        'bet_invite'::text as kind,
        b.id               as bet_id,
        null::uuid         as payment_id,
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
        null::uuid             as payment_id,
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
        null::uuid        as payment_id,
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

      union all

      -- 4. payment_confirm — dłużnik zadeklarował spłatę, p_viewer (wierzyciel)
      --    ma ją potwierdzić lub odrzucić. Nie jest przypisana do zakładu:
      --    bet_id = NULL, payment_id = pay.id, other_id = dłużnik (from_user).
      select
        'payment_confirm'::text as kind,
        null::uuid              as bet_id,
        pay.id                  as payment_id,
        pay.from_user           as other_id,
        null::text              as game_template,
        pay.amount::numeric     as stake,
        pay.created_at          as created_at
      from public.payments pay
      where pay.status = 'pending'
        and pay.deleted_at is null
        and pay.to_user = p_viewer
    ) u
    order by coalesce(u.bet_id, u.payment_id), u.other_id nulls last
  ) dedup
  order by dedup.created_at desc nulls last, coalesce(dedup.bet_id, dedup.payment_id);
$function$;

revoke all on function public.get_pending_actions(uuid) from public;
revoke all on function public.get_pending_actions(uuid) from anon;
grant execute on function public.get_pending_actions(uuid) to authenticated;
