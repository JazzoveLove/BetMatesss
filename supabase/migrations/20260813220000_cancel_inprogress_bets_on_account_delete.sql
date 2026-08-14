-- Rozszerza delete_my_account: zakłady W TOKU (active / awaiting_confirmation /
-- disputed) usuwającego się użytkownika są anulowane, tak samo jak w #20 przy
-- ręcznym anulowaniu sporu. Wcześniej obsługiwane było tylko 'pending' — zakłady
-- w toku zostawały zawieszone na zawsze z "duchem" jako uczestnikiem.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Brak autoryzacji — nie można usunąć konta.'
      using errcode = '28000';
  end if;

  if not exists (select 1 from public.users where id = v_uid) then
    raise exception 'Nie znaleziono profilu użytkownika.'
      using errcode = 'P0002';
  end if;

  -- 1. Zakłady oczekujące na potwierdzenie przez usuwającego się użytkownika
  --    odrzucamy, żeby druga strona nie została z wiszącym zaproszeniem na zawsze.
  update public.bets b
  set status = 'rejected',
      rejected_at = now()
  where b.status = 'pending'
    and exists (
      select 1 from public.bet_participants bp
      where bp.bet_id = b.id and bp.user_id = v_uid
    );

  -- 1b. Zakłady w toku anulujemy z tego samego powodu — inaczej zostałyby
  --     zawieszone na zawsze, bez możliwości wpisania/potwierdzenia wyniku.
  update public.bets b
  set status = 'cancelled'
  where b.status in ('active', 'awaiting_confirmation', 'disputed')
    and exists (
      select 1 from public.bet_participants bp
      where bp.bet_id = b.id and bp.user_id = v_uid
    );

  -- 2. Anonimizacja danych osobowych w profilu.
  --    Nick musi pozostać unikalny (constraint UNIQUE), stąd sufiks z ID.
  --    Aplikacja i tak wyświetla "Usunięty użytkownik" na podstawie deleted_at.
  update public.users
  set nick = 'usuniety_' || v_uid::text,
      avatar_url = null,
      invite_code = null,
      deleted_at = now()
  where id = v_uid;

  -- 3. Dane czysto prywatne, bez wartości dla innych użytkowników — usuwane w całości.
  delete from public.friendships where user_a = v_uid or user_b = v_uid;
  delete from public.notifications where user_id = v_uid;

  -- 4. Realne usunięcie konta logowania. Od tego momentu logowanie jest niemożliwe.
  delete from auth.users where id = v_uid;
end;
$function$;