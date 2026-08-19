-- P0-3 (audyt 15.08.2026): trigger chronił tylko user_a/user_b, nie status.
-- Nadawca zaproszenia (user_a) mógł bezpośrednim wywołaniem API ustawić
-- status = 'accepted' bez zgody drugiej strony, bo friendships_update
-- pozwala na UPDATE zarówno user_a jak i user_b. Jedyne legalne przejście
-- statusu w aplikacji to pending -> accepted, wykonywane przez odbiorcę
-- (patrz acceptFriendship / ensureFriendshipAccepted w friends.actions.ts).
-- Odrzucenie zaproszenia to DELETE (rejectFriendship), nie zmiana statusu.

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

  if new.status is distinct from old.status
     and not (old.status = 'pending' and new.status = 'accepted' and auth.uid() = old.user_b) then
    raise exception 'Niedozwolona zmiana statusu znajomości';
  end if;

  return new;
end;
$function$;
