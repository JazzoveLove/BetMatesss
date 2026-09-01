-- KROK 2.5b — potwierdzanie spłat (BŁĄD-4 + BŁĄD-4b). Zamyka Krok 2.5.
--
-- BŁĄD-4: dziś każda ze stron wstawia wiersz do payments i to NATYCHMIAST
-- zmienia bilans (get_pair_balance / get_balances_with_friends /
-- get_balances_screen_data sumują payments bez żadnego warunku stanu).
-- Dłużnik może więc sam zadeklarować "oddałem" i poprawić swoje saldo bez
-- wiedzy wierzyciela — ta sama klasa obejścia co ustawienie bets.status na
-- 'completed' bez potwierdzonego wyniku, zamknięta triggerem w
-- 20260818100200. Naprawa tą samą metodą: kolumna stanu + trigger, który
-- ustala stan po stronie BAZY, nie po stronie klienta.
-- (Filtr `status = 'confirmed'` w funkcjach salda dokłada osobna migracja
--  20260902120100 — ta zajmuje się wyłącznie zapisem i autoryzacją.)
--
-- BŁĄD-4b (problem-bliźniak, wychodzi przy okazji): delete_payment pozwala
-- DOWOLNEJ stronie usunąć DOWOLNĄ płatność, także już potwierdzoną — czyli
-- wierzyciel może jednostronnie "wskrzesić" spłacony dług. Zawężamy do
-- autora wpisu i tylko stanu 'pending' (patrz sekcja 6 — świadome
-- zaostrzenie względem dzisiejszego zachowania).

-- =========================================================================
-- 1. Kolumna stanu
-- =========================================================================
-- DEFAULT 'confirmed' jest celowy: wszystkie dzisiejsze wiersze (sprzed tej
-- funkcji) mają być uznane za już potwierdzone — nic nie znika z historii
-- ani z bilansów przy migracji.

alter table public.payments
  add column status text not null default 'confirmed'
  check (status in ('pending', 'confirmed', 'rejected'));

-- =========================================================================
-- 2. Trigger BEFORE INSERT — stan ustala baza, nie klient
-- =========================================================================
-- Klient NIE MOŻE deklarować status przy INSERT (inaczej dłużnik wyśle
-- 'confirmed' wprost i ominie całą naprawę). Trigger nadpisuje to, co
-- przyszło:
--   * wstawia dłużnik   (auth.uid() = from_user)  → 'pending'
--   * wstawia wierzyciel (auth.uid() = to_user)   → 'confirmed'
--     (działa na jego niekorzyść — nikt nie zaniża własnej należności w
--      złej wierze, potwierdzenie zbędne)
--   * pozostały przypadek (auth.uid() IS NULL — service_role / seed /
--     fixture) → 'confirmed'. RLS payments_insert i tak wymaga
--     auth.uid() IN (from_user, to_user) dla klienta, więc ta gałąź dotyczy
--     wyłącznie wpisów administracyjnych, które mają być traktowane jak
--     historyczne (spójne z DEFAULT 'confirmed').

create or replace function public.set_payment_status_on_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if (select auth.uid()) = new.from_user then
    new.status := 'pending';
  else
    new.status := 'confirmed';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_payments_set_status_on_insert on public.payments;
create trigger trg_payments_set_status_on_insert before insert on public.payments
  for each row execute function public.set_payment_status_on_insert();

-- =========================================================================
-- 3. Trigger BEFORE UPDATE — biała lista dozwolonych zmian
-- =========================================================================
-- Styl jak prevent_bets_protected_field_change /
-- prevent_bet_participants_protected_field_change (20260810120000,
-- 20260818100200): twarda biała lista pól + dozwolone przejścia statusu.
-- Jedyna dozwolona zmiana treści to status 'pending' → 'confirmed'/'rejected'.
-- deleted_at przepuszczamy — to jedyna ścieżka soft-delete (delete_payment,
-- SECURITY DEFINER, z własną autoryzacją); żadne inne pole nie może się
-- ruszyć. Brak powrotu z 'rejected' — nowa próba spłaty to nowy wiersz.

create or replace function public.prevent_payments_protected_field_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.id is distinct from old.id
     or new.amount is distinct from old.amount
     or new.from_user is distinct from old.from_user
     or new.to_user is distinct from old.to_user
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Nie można zmieniać treści płatności — dozwolone tylko potwierdzenie/odrzucenie.';
  end if;

  if new.status is distinct from old.status then
    if old.status <> 'pending' or new.status not in ('confirmed', 'rejected') then
      raise exception 'Niedozwolone przejście statusu płatności: % -> %', old.status, new.status;
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_payments_protect_fields on public.payments;
create trigger trg_payments_protect_fields before update on public.payments
  for each row execute function public.prevent_payments_protected_field_change();

-- =========================================================================
-- 4. RLS UPDATE — potwierdzenie / odrzucenie przez wierzyciela
-- =========================================================================
-- payments dotąd nie miało polityki UPDATE ani grantu UPDATE dla
-- authenticated (20260819120100 — celowo wąski zestaw, bo soft-delete szedł
-- wyłącznie przez delete_payment). Świadomie otwieramy JEDNĄ wąską ścieżkę:
-- wierzyciel (to_user) rozstrzyga wiszącą płatność.
--   * tylko auth.uid() = to_user
--   * tylko gdy status sprzed zmiany = 'pending'   (USING  = stary wiersz)
--   * tylko na 'confirmed' albo 'rejected'         (WITH CHECK = nowy wiersz)
-- Reszta pól pilnowana przez trg_payments_protect_fields (sekcja 3).

grant update on table public.payments to authenticated;

drop policy if exists payments_confirm_or_reject on public.payments;
create policy payments_confirm_or_reject on public.payments for update
using (
  (select auth.uid()) = to_user
  and status = 'pending'
)
with check (
  (select auth.uid()) = to_user
  and status in ('confirmed', 'rejected')
);

-- =========================================================================
-- 5. RLS INSERT — blokada duplikatu wiszącej sprawy (E24)
-- =========================================================================
-- Dopóki jedna spłata między parą wisi nierozpatrzona, nie da się zgłosić
-- drugiej do tej samej osoby (w dowolną stronę). Pozostałe warunki
-- (created_by, strona płatności, znajomość LUB wspólna historia zakładów z
-- BŁĘDU-2 / 20260829130000) bez zmian.
--
-- Sprawdzenie "czy między tą parą wisi już pending" MUSI iść przez funkcję
-- SECURITY DEFINER, nie przez gołe podzapytanie w WITH CHECK: polityka na
-- payments odwołująca się w swoim wyrażeniu do payments wywołuje
-- "infinite recursion detected in policy for relation payments". Ten sam
-- wzorzec obejścia co is_bet_participant / can_see_user (podzapytanie po
-- tabeli chronionej RLS zamknięte w funkcji definiującej właściciela).
--
-- Funkcja jest wywoływalna wprost przez authenticated (polityka RLS liczy się
-- z uprawnieniami wywołującego, więc GRANT jest wymagany) — dlatego sama
-- pilnuje, że pytający jest jedną ze stron pary: bez tego byłaby sondą
-- "czy X i Y mają między sobą wiszącą spłatę" dla dowolnych obcych. W miejscu
-- wywołania w polityce ten warunek zawsze przechodzi (wcześniejszy człon
-- WITH CHECK już wymusza auth.uid() ∈ {from_user, to_user}). auth.uid() NULL
-- (service_role) → false, spójnie z gałęzią seed w triggerze INSERT.
--
-- Wyścig dwóch równoległych INSERT-ów (oba widzą "brak pending") domyka
-- częściowy unikat payments_one_pending_per_pair niżej — ten sam wzorzec co
-- bet_results_one_pending_per_bet w baseline. Warunek w polityce zostaje, bo
-- daje czysty komunikat zamiast surowego błędu constraintu na typowej ścieżce.

create or replace function public.has_pending_payment_between(p_a uuid, p_b uuid)
returns boolean
language sql
stable security definer
set search_path to 'public', 'pg_temp'
as $function$
  select coalesce(
    (select auth.uid()) in (p_a, p_b)
    and exists (
      select 1 from public.payments p
      where p.status = 'pending'
        and p.deleted_at is null
        and (
          (p.from_user = p_a and p.to_user = p_b)
          or (p.from_user = p_b and p.to_user = p_a)
        )
    ),
    false
  );
$function$;

revoke all on function public.has_pending_payment_between(uuid, uuid) from public;
revoke all on function public.has_pending_payment_between(uuid, uuid) from anon;
grant execute on function public.has_pending_payment_between(uuid, uuid) to authenticated;

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
  and not public.has_pending_payment_between(payments.from_user, payments.to_user)
);

create unique index payments_one_pending_per_pair on public.payments
  (least(from_user, to_user), greatest(from_user, to_user))
  where status = 'pending' and deleted_at is null;

-- =========================================================================
-- 6. delete_payment — ZAOSTRZENIE (naprawa BŁĘDU-4b)
-- =========================================================================
-- ŚWIADOMA ZMIANA ZACHOWANIA. Dziś (20260818100100): każda ze stron może
-- usunąć dowolną płatność, także potwierdzoną. Po zmianie wymagane dodatkowo:
--   * status = 'pending'      — nie da się usunąć potwierdzonej ani odrzuconej
--   * auth.uid() = created_by — tylko autor wpisu (nie obie strony)
-- Bez tego wierzyciel mógłby jednostronnie skasować potwierdzoną spłatę i
-- odtworzyć spłacony dług bez zgody dłużnika. "Wycofanie" ma sens wyłącznie
-- dla własnej, jeszcze nierozpatrzonej deklaracji — rozpatrzoną spłatę można
-- tylko potwierdzić/odrzucić (wierzyciel), nie skasować.

create or replace function public.delete_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_created_by uuid;
  v_status text;
begin
  select created_by, status into v_created_by, v_status
  from public.payments
  where id = p_payment_id and deleted_at is null;

  if v_created_by is null then
    raise exception 'Nie znaleziono wpisu spłaty.' using errcode = 'P0002';
  end if;

  if auth.uid() is null or auth.uid() <> v_created_by then
    raise exception 'Brak autoryzacji — wycofać spłatę może tylko jej autor.'
      using errcode = '28000';
  end if;

  if v_status <> 'pending' then
    raise exception 'Można wycofać tylko nierozpatrzoną spłatę.'
      using errcode = 'P0001';
  end if;

  update public.payments
  set deleted_at = now()
  where id = p_payment_id and deleted_at is null;
end;
$function$;

-- =========================================================================
-- 7. delete_my_account — wiszące spłaty do rozpatrzenia przez usuwającego
-- =========================================================================
-- Płatności 'pending', gdzie usuwający się jest to_user (jedyny uprawniony
-- do rozpatrzenia — patrz payments_confirm_or_reject), dostają 'rejected' —
-- inaczej wisiałyby na zawsze, bo nikt nie mógłby ich już
-- potwierdzić/odrzucić. 'rejected' (nie 'confirmed') świadomie: dług
-- zostaje, bezpieczniejsza opcja domyślna, nie zaniża niczyjego długu bez
-- weryfikacji drugiej strony. Krok dopisany między anulowaniem zakładów a
-- anonimizacją profilu; reszta funkcji bez zmian względem 20260813220000.

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

  -- 1c. Wiszące spłaty, które tylko usuwający się mógł rozpatrzyć (jest ich
  --     to_user) — odrzucamy, żeby nie zostały pending na zawsze.
  update public.payments
  set status = 'rejected'
  where status = 'pending'
    and to_user = v_uid
    and deleted_at is null;

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
