-- P1-8 (audyt 15.08.2026): auth.uid() użyte bezpośrednio w RLS (using/with_check)
-- bywa przeliczane osobno dla każdego skanowanego wiersza, zamiast raz na
-- zapytanie. Owinięcie w (select auth.uid()) każe planerowi policzyć to
-- jako InitPlan — raz, cache'owane. Sama semantyka polityk bez zmian,
-- tylko forma zapisu (zalecenie Supabase, advisor auth_rls_initplan).
--
-- Obejmuje 22 polityki zgłoszone przez advisora — w tym notifications_insert,
-- napisaną dopiero w 20260818100300, ze świeżo tym samym niedopatrzeniem.
-- users_select (can_see_user(id)) i settlements_insert nie są tu ujęte —
-- advisor ich nie zgłasza (can_see_user nie ma auth.uid() bezpośrednio w
-- tekście polityki, a settlements_insert w ogóle go nie używa).

-- =========================================================================
-- bet_participants
-- =========================================================================

drop policy if exists bet_participants_insert on public.bet_participants;
create policy bet_participants_insert on public.bet_participants for insert
with check (
  user_id = (select auth.uid())
  or exists (select 1 from public.bets b where b.id = bet_participants.bet_id and b.creator_id = (select auth.uid()))
);

drop policy if exists bet_participants_select on public.bet_participants;
create policy bet_participants_select on public.bet_participants for select
using (is_bet_participant(bet_id, (select auth.uid())));

drop policy if exists bet_participants_update on public.bet_participants;
create policy bet_participants_update on public.bet_participants for update
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- =========================================================================
-- bet_results
-- =========================================================================

drop policy if exists bet_results_insert on public.bet_results;
create policy bet_results_insert on public.bet_results for insert
with check (recorded_by = (select auth.uid()) and is_bet_participant(bet_id, (select auth.uid())));

drop policy if exists bet_results_select on public.bet_results;
create policy bet_results_select on public.bet_results for select
using (is_bet_participant(bet_id, (select auth.uid())));

drop policy if exists bet_results_confirm on public.bet_results;
create policy bet_results_confirm on public.bet_results for update
using (confirmed = false and recorded_by <> (select auth.uid()) and is_bet_participant(bet_id, (select auth.uid())))
with check (confirmed = true and confirmed_by = (select auth.uid()));

-- =========================================================================
-- bets
-- =========================================================================

drop policy if exists bets_insert on public.bets;
create policy bets_insert on public.bets for insert
with check ((select auth.uid()) = creator_id);

drop policy if exists bets_select on public.bets;
create policy bets_select on public.bets for select
using ((select auth.uid()) = creator_id or is_bet_participant(id, (select auth.uid())));

drop policy if exists bets_update on public.bets;
create policy bets_update on public.bets for update
using ((select auth.uid()) = creator_id or is_bet_participant(id, (select auth.uid())))
with check ((select auth.uid()) = creator_id or is_bet_participant(id, (select auth.uid())));

-- =========================================================================
-- friendships
-- =========================================================================

drop policy if exists friendships_select on public.friendships;
create policy friendships_select on public.friendships for select
using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

drop policy if exists friendships_insert on public.friendships;
create policy friendships_insert on public.friendships for insert
with check ((select auth.uid()) = user_a);

drop policy if exists friendships_update on public.friendships;
create policy friendships_update on public.friendships for update
using ((select auth.uid()) = user_a or (select auth.uid()) = user_b)
with check ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

drop policy if exists friendships_delete on public.friendships;
create policy friendships_delete on public.friendships for delete
using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

-- =========================================================================
-- notifications
-- =========================================================================

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select
using ((select auth.uid()) = user_id);

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert
with check (
  type = 'bet_invite'
  and payload ->> 'fromUserId' = (select auth.uid())::text
  and exists (
    select 1
    from public.bets b
    join public.bet_participants bp
      on bp.bet_id = b.id
     and bp.user_id = notifications.user_id
     and bp.confirmed = false
    where b.id = (payload ->> 'betId')::uuid
      and b.status = 'pending'
      and b.creator_id = (select auth.uid())
  )
);

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications for delete
using ((select auth.uid()) = user_id);

-- =========================================================================
-- payments
-- =========================================================================

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select
using ((select auth.uid()) = from_user or (select auth.uid()) = to_user);

drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments for insert
with check (
  (select auth.uid()) = created_by
  and ((select auth.uid()) = from_user or (select auth.uid()) = to_user)
  and exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and (
        (f.user_a = payments.from_user and f.user_b = payments.to_user)
        or (f.user_a = payments.to_user and f.user_b = payments.from_user)
      )
  )
);

-- =========================================================================
-- settlements
-- =========================================================================

drop policy if exists settlements_select on public.settlements;
create policy settlements_select on public.settlements for select
using ((select auth.uid()) = debtor_id or (select auth.uid()) = creditor_id);

-- =========================================================================
-- users
-- =========================================================================

drop policy if exists users_insert on public.users;
create policy users_insert on public.users for insert
with check ((select auth.uid()) = id);

drop policy if exists users_update on public.users;
create policy users_update on public.users for update
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
