-- P1-2 (audyt 15.08.2026): notifications_insert miało with_check = can_see_user(user_id)
-- — każdy znajomy/współuczestnik zakładu mógł wstawić Ci powiadomienie
-- z dowolną treścią payloadu. type jest już ograniczone przez CHECK
-- (type = 'bet_invite'), więc realny problem to nie "dowolny typ", tylko:
--   - fromUserId/fromNick w payload można sfałszować (impersonacja nadawcy)
--   - betId może wskazywać na cokolwiek — nieistniejący/cudzy/rozstrzygnięty
--     zakład — spam bez pokrycia w rzeczywistym zaproszeniu
--   - message jest dowolnym tekstem renderowanym wprost w UI odbiorcy
--   - brak limitu — ten sam wpis można wstawić dowolną liczbę razy
--
-- sendBetInvite (jedyne miejsce, które w ogóle tworzy notifications) jest
-- wołane wyłącznie przez twórcę zakładu, zawsze PO wstawieniu wiersza do
-- bet_participants (patrz bets.create.ts). Nowa polityka wymusza, żeby
-- insert odzwierciedlał dokładnie ten realny stan: nadawca = auth.uid(),
-- zakład istnieje, jest 'pending', został utworzony przez nadawcę, a
-- odbiorca jest jego niepotwierdzonym uczestnikiem. Unikalny indeks
-- dodatkowo blokuje duplikaty tego samego nieprzeczytanego zaproszenia.

drop policy if exists notifications_insert on public.notifications;

create policy notifications_insert on public.notifications for insert
with check (
  type = 'bet_invite'
  and payload ->> 'fromUserId' = auth.uid()::text
  and exists (
    select 1
    from public.bets b
    join public.bet_participants bp
      on bp.bet_id = b.id
     and bp.user_id = notifications.user_id
     and bp.confirmed = false
    where b.id = (payload ->> 'betId')::uuid
      and b.status = 'pending'
      and b.creator_id = auth.uid()
  )
);

create unique index notifications_pending_bet_invite_unique
  on public.notifications (user_id, (payload ->> 'betId'))
  where (type = 'bet_invite' and read = false);
