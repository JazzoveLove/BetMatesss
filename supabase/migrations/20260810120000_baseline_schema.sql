-- Baseline migracja: zrzut pełnego schematu public z żywej bazy Supabase (2026-08-10).
--
-- Ten plik zastępuje 26 wcześniejszych migracji, które zostały zaaplikowane
-- bezpośrednio na projekt przez Supabase MCP i nigdy nie trafiły do repo
-- (historia: fix_rls_broad_vs_narrow_policies … drop_rivalries).
-- Od teraz każda kolejna zmiana schematu ma iść przez nowy plik w
-- supabase/migrations/, żeby historia bazy była w git, nie tylko na serwerze.
--
-- Zawartość: tabele, kolumny, constrainty, indeksy, funkcje, triggery,
-- RLS (włączone na wszystkich tabelach + polityki). Grantów tabelowych
-- (anon/authenticated/service_role CRUD) nie odtwarzamy jawnie — to domyślne
-- uprawnienia nadawane automatycznie przez Supabase przy tworzeniu tabeli;
-- realną kontrolą dostępu jest RLS.

create extension if not exists pgcrypto;

-- =========================================================================
-- TABELE
-- =========================================================================

create table public.users (
  id uuid primary key,
  nick text not null unique,
  avatar_url text,
  created_at timestamptz default now(),
  invite_code text,
  deleted_at timestamptz
);

comment on column public.users.deleted_at is
  'Data usunięcia konta. NULL = konto aktywne. Wypełnione = profil-duch po usuniętym koncie (dane osobowe zanonimizowane, brak możliwości logowania), zachowany wyłącznie po to, by historia zakładów innych użytkowników pozostała spójna.';

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.users(id),
  user_b uuid not null references public.users(id),
  status text not null default 'pending' check (status = any (array['pending','accepted'])),
  created_at timestamptz default now(),
  constraint friendships_distinct_users check (user_a <> user_b)
);

create table public.bets (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id),
  game_template text not null,
  format text not null check (format = 'single'),
  stake_mode text not null check (stake_mode = any (array['equal','none'])),
  status text not null default 'pending'
    check (status = any (array['pending','active','awaiting_confirmation','completed','disputed','rejected'])),
  created_at timestamptz default now(),
  stake_per_match numeric,
  rejected_at timestamptz
);

create table public.bet_participants (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id) on delete cascade,
  user_id uuid not null references public.users(id),
  stake_amount integer not null default 0,
  odds numeric not null default 1,
  role text not null default 'participant' check (role = any (array['creator','participant'])),
  confirmed boolean not null default false,
  constraint bet_participants_unique_per_bet unique (bet_id, user_id)
);

create table public.bet_results (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id) on delete cascade,
  match_number integer default 1,
  scores jsonb,
  recorded_by uuid not null references public.users(id),
  confirmed_by uuid references public.users(id),
  created_at timestamptz default now(),
  confirmed boolean not null default false,
  winner_id uuid not null references public.users(id)
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id) on delete cascade,
  debtor_id uuid not null references public.users(id),
  creditor_id uuid not null references public.users(id),
  amount integer not null
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  type text not null check (type = 'bet_invite'),
  payload jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.users(id),
  to_user uuid not null references public.users(id),
  amount integer not null check (amount > 0),
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint payments_distinct_users check (from_user <> to_user),
  constraint payments_created_by_is_party check (created_by = from_user or created_by = to_user)
);

-- =========================================================================
-- INDEKSY
-- =========================================================================

create index bet_participants_bet_id_idx on public.bet_participants using btree (bet_id);
create index bet_participants_user_id_idx on public.bet_participants using btree (user_id);

create index bet_results_bet_id_idx on public.bet_results using btree (bet_id);
create index bet_results_confirmed_by_idx on public.bet_results using btree (confirmed_by);
create index bet_results_recorded_by_idx on public.bet_results using btree (recorded_by);
create index bet_results_winner_id_idx on public.bet_results using btree (winner_id);
-- Tylko jeden niepotwierdzony wynik na zakład na raz.
create unique index bet_results_one_pending_per_bet on public.bet_results using btree (bet_id) where (confirmed = false);

create index bets_creator_id_idx on public.bets using btree (creator_id);

create index friendships_user_a_idx on public.friendships using btree (user_a);
create index friendships_user_b_idx on public.friendships using btree (user_b);

create index notifications_user_id_idx on public.notifications using btree (user_id);
create index notifications_pending_idx on public.notifications using btree (user_id, type) where (read = false);

create index payments_from_user_idx on public.payments using btree (from_user);
create index payments_to_user_idx on public.payments using btree (to_user);
create index payments_created_by_idx on public.payments using btree (created_by);

create index settlements_bet_id_idx on public.settlements using btree (bet_id);
create index settlements_debtor_id_idx on public.settlements using btree (debtor_id);
create index settlements_creditor_id_idx on public.settlements using btree (creditor_id);
-- Maksymalnie jedno rozliczenie na zakład (format 'single').
create unique index settlements_one_per_bet on public.settlements using btree (bet_id);

create index users_active_idx on public.users using btree (id) where (deleted_at is null);
create unique index users_invite_code_lower_key on public.users using btree (lower(trim(invite_code)))
  where (invite_code is not null and length(trim(invite_code)) > 0);

-- =========================================================================
-- FUNKCJE POMOCNICZE (używane w politykach RLS)
-- =========================================================================

create or replace function public.is_bet_participant(p_bet_id uuid, p_user_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  select exists (
    select 1 from public.bet_participants
    where bet_id = p_bet_id and user_id = p_user_id
  );
$function$;

create or replace function public.can_see_user(p_target uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  select
    p_target = auth.uid()
    or exists (
      select 1 from public.friendships f
      where (f.user_a = auth.uid() and f.user_b = p_target)
         or (f.user_b = auth.uid() and f.user_a = p_target)
    )
    or exists (
      select 1
      from public.bet_participants me
      join public.bet_participants other on other.bet_id = me.bet_id
      where me.user_id = auth.uid()
        and other.user_id = p_target
    );
$function$;

create or replace function public.user_exists_for_friend_invite(p_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  select exists (
    select 1 from public.users u
    where u.id = p_id and u.deleted_at is null
  );
$function$;

create or replace function public.lookup_user_by_invite_code(p_code text)
 returns table(user_id uuid, user_nick text)
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  select u.id, u.nick
  from public.users u
  where u.invite_code is not null
    and length(trim(u.invite_code)) > 0
    and lower(trim(u.invite_code)) = lower(trim(p_code))
    and u.deleted_at is null
  limit 1;
$function$;

-- =========================================================================
-- FUNKCJE TRIGGERÓW (ochrona pól, których nie wolno zmieniać po utworzeniu)
-- =========================================================================

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
  return new;
end;
$function$;

create or replace function public.prevent_bet_participants_protected_field_change()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if new.stake_amount is distinct from old.stake_amount
     or new.role is distinct from old.role then
    raise exception 'Nie można zmieniać stake_amount/role po utworzeniu uczestnictwa';
  end if;
  return new;
end;
$function$;

create or replace function public.prevent_bet_results_protected_field_change()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if new.winner_id is distinct from old.winner_id
     or new.scores is distinct from old.scores
     or new.recorded_by is distinct from old.recorded_by
     or new.bet_id is distinct from old.bet_id
     or new.match_number is distinct from old.match_number then
    raise exception 'Nie można zmieniać wyniku po jego zgłoszeniu — tylko potwierdzić.';
  end if;
  return new;
end;
$function$;

create or replace function public.prevent_friendships_protected_field_change()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if new.user_a is distinct from old.user_a
     or new.user_b is distinct from old.user_b then
    raise exception 'Nie można zmieniać stron relacji znajomości po utworzeniu';
  end if;
  return new;
end;
$function$;

create trigger trg_bets_protect_fields before update on public.bets
  for each row execute function public.prevent_bets_protected_field_change();

create trigger trg_bet_participants_protect_fields before update on public.bet_participants
  for each row execute function public.prevent_bet_participants_protected_field_change();

create trigger prevent_bet_results_protected_field_change before update on public.bet_results
  for each row execute function public.prevent_bet_results_protected_field_change();

create trigger trg_friendships_protect_fields before update on public.friendships
  for each row execute function public.prevent_friendships_protected_field_change();

-- =========================================================================
-- RPC: zakłady i wyniki
-- =========================================================================

create or replace function public.create_bet_with_participants(
  p_creator_id uuid, p_game_template text, p_format text, p_stake_mode text,
  p_participants jsonb, p_stake_per_match numeric default null
)
 returns uuid
 language plpgsql
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_bet_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_creator_id then
    raise exception 'Brak autoryzacji — creator_id musi zgadzac sie z zalogowanym uzytkownikiem.' using errcode = '28000';
  end if;

  if p_participants is null or jsonb_array_length(p_participants) = 0 then
    raise exception 'Zaklad musi miec przynajmniej jednego uczestnika.' using errcode = 'P0001';
  end if;

  insert into public.bets (creator_id, game_template, format, stake_mode, status, stake_per_match)
  values (
    p_creator_id,
    p_game_template,
    p_format,
    p_stake_mode,
    'pending',
    case when p_format = 'per_match' then greatest(0, coalesce(p_stake_per_match, 0)) else null end
  )
  returning id into v_bet_id;

  insert into public.bet_participants (bet_id, user_id, stake_amount, odds, role, confirmed)
  select
    v_bet_id,
    (p->>'user_id')::uuid,
    (p->>'stake_amount')::numeric,
    (p->>'odds')::numeric,
    p->>'role',
    (p->>'confirmed')::boolean
  from jsonb_array_elements(p_participants) as p;

  return v_bet_id;
end;
$function$;

create or replace function public.submit_bet_result(p_bet_id uuid, p_winner_id uuid, p_score text, p_recorded_by uuid)
 returns uuid
 language plpgsql
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_result_id uuid;
  v_format text;
begin
  if auth.uid() is null or auth.uid() <> p_recorded_by then
    raise exception 'Brak autoryzacji.' using errcode = '28000';
  end if;

  select format into v_format from public.bets where id = p_bet_id;
  if v_format = 'per_match' then
    raise exception 'Ten zaklad jest rozliczany mecz po meczu.' using errcode = 'P0001';
  end if;

  insert into public.bet_results (bet_id, match_number, winner_id, scores, recorded_by, confirmed)
  values (p_bet_id, 1, p_winner_id, jsonb_build_object('score', p_score), p_recorded_by, false)
  returning id into v_result_id;

  update public.bets set status = 'awaiting_confirmation' where id = p_bet_id;

  return v_result_id;
end;
$function$;

-- =========================================================================
-- RPC: rozliczenia i saldo
-- =========================================================================

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
      where p.from_user = p_other and p.to_user = p_viewer and p.deleted_at is null
    ), 0)
    + coalesce((
      select sum(p.amount) from public.payments p
      where p.from_user = p_viewer and p.to_user = p_other and p.deleted_at is null
    ), 0)
$function$;

create or replace function public.get_pair_stats(p_viewer uuid, p_other uuid)
 returns table(game_template text, wins integer, losses integer)
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
  select
    b.game_template,
    count(*) filter (where r.winner_id = p_viewer)::integer as wins,
    count(*) filter (where r.winner_id = p_other)::integer as losses
  from public.bets b
  join public.bet_results r on r.bet_id = b.id and r.confirmed = true
  where b.format <> 'per_match'
    and r.winner_id in (p_viewer, p_other)
    and exists (select 1 from public.bet_participants bp1 where bp1.bet_id = b.id and bp1.user_id = p_viewer)
    and exists (select 1 from public.bet_participants bp2 where bp2.bet_id = b.id and bp2.user_id = p_other)
  group by b.game_template;
$function$;

create or replace function public.delete_payment(p_payment_id uuid)
 returns void
 language plpgsql
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_from uuid;
  v_to uuid;
begin
  select from_user, to_user into v_from, v_to
  from public.payments
  where id = p_payment_id and deleted_at is null;

  if v_from is null then
    raise exception 'Nie znaleziono wpisu spłaty.' using errcode = 'P0002';
  end if;

  if auth.uid() is null or (auth.uid() <> v_from and auth.uid() <> v_to) then
    raise exception 'Brak autoryzacji.' using errcode = '28000';
  end if;

  update public.payments
  set deleted_at = now()
  where id = p_payment_id and deleted_at is null;
end;
$function$;

-- =========================================================================
-- RPC: konto użytkownika
-- =========================================================================

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

-- =========================================================================
-- GRANTY NA FUNKCJACH
-- Funkcje wołane bezpośrednio z klienta jako RPC dostają EXECUTE dla
-- authenticated. Funkcje pomocnicze/trigger dla RLS/triggerów zostają
-- odcięte od public/anon (revoke all from public jest domyślne przy
-- "security definer" — tu wypisujemy jawnie, żeby było widać intencję).
-- =========================================================================

revoke all on function public.get_pair_stats(uuid, uuid) from public;
revoke all on function public.get_pair_stats(uuid, uuid) from anon;
grant execute on function public.get_pair_stats(uuid, uuid) to authenticated;

-- =========================================================================
-- RLS
-- =========================================================================

alter table public.users enable row level security;
alter table public.friendships enable row level security;
alter table public.bets enable row level security;
alter table public.bet_participants enable row level security;
alter table public.bet_results enable row level security;
alter table public.settlements enable row level security;
alter table public.notifications enable row level security;
alter table public.payments enable row level security;

-- users
create policy users_select on public.users for select
  using (can_see_user(id));
create policy users_insert on public.users for insert
  with check (auth.uid() = id);
create policy users_update on public.users for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- friendships
create policy friendships_select on public.friendships for select
  using (auth.uid() = user_a or auth.uid() = user_b);
create policy friendships_insert on public.friendships for insert
  with check (auth.uid() = user_a);
create policy friendships_update on public.friendships for update
  using (auth.uid() = user_a or auth.uid() = user_b)
  with check (auth.uid() = user_a or auth.uid() = user_b);
create policy friendships_delete on public.friendships for delete
  using (auth.uid() = user_a or auth.uid() = user_b);

-- bets
create policy bets_select on public.bets for select
  using (auth.uid() = creator_id or is_bet_participant(id, auth.uid()));
create policy bets_insert on public.bets for insert
  with check (auth.uid() = creator_id);
create policy bets_update on public.bets for update
  using (auth.uid() = creator_id or is_bet_participant(id, auth.uid()))
  with check (auth.uid() = creator_id or is_bet_participant(id, auth.uid()));

-- bet_participants
create policy bet_participants_select on public.bet_participants for select
  using (is_bet_participant(bet_id, auth.uid()));
create policy bet_participants_insert on public.bet_participants for insert
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.bets b where b.id = bet_participants.bet_id and b.creator_id = auth.uid())
  );
create policy bet_participants_update on public.bet_participants for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- bet_results
create policy bet_results_select on public.bet_results for select
  using (is_bet_participant(bet_id, auth.uid()));
create policy bet_results_insert on public.bet_results for insert
  with check (recorded_by = auth.uid() and is_bet_participant(bet_id, auth.uid()));
-- Druga strona (nie ta, co zgłosiła wynik) może go potwierdzić, i tylko potwierdzić.
create policy bet_results_confirm on public.bet_results for update
  using (confirmed = false and recorded_by <> auth.uid() and is_bet_participant(bet_id, auth.uid()))
  with check (confirmed = true and confirmed_by = auth.uid());

-- settlements (append-only: brak polityk update/delete)
create policy settlements_select on public.settlements for select
  using (auth.uid() = debtor_id or auth.uid() = creditor_id);
create policy settlements_insert on public.settlements for insert
  with check (
    is_bet_participant(bet_id, debtor_id)
    and is_bet_participant(bet_id, creditor_id)
    and debtor_id <> creditor_id
    and exists (select 1 from public.bet_results r where r.bet_id = settlements.bet_id and r.confirmed = true)
  );

-- notifications
create policy notifications_select on public.notifications for select
  using (auth.uid() = user_id);
create policy notifications_insert on public.notifications for insert
  with check (can_see_user(user_id));
create policy notifications_update on public.notifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy notifications_delete on public.notifications for delete
  using (auth.uid() = user_id);

-- payments (soft-delete only: brak polityki delete/update poza samą kolumną deleted_at
-- ustawianą przez RPC delete_payment, więc nie ma osobnej polityki update)
create policy payments_select on public.payments for select
  using (auth.uid() = from_user or auth.uid() = to_user);
create policy payments_insert on public.payments for insert
  with check (
    auth.uid() = created_by
    and (auth.uid() = from_user or auth.uid() = to_user)
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.user_a = payments.from_user and f.user_b = payments.to_user)
          or (f.user_a = payments.to_user and f.user_b = payments.from_user)
        )
    )
  );