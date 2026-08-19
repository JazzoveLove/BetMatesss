-- P0-4 (audyt 15.08.2026): delete_payment nie miał SECURITY DEFINER, więc
-- wykonywał się z uprawnieniami wywołującego. Tabela payments ma tylko
-- polityki INSERT i SELECT — brak polityki UPDATE oznaczał, że
-- "update payments set deleted_at = now()" trafiało w 0 wierszy bez błędu.
-- Funkcja kończyła się "sukcesem" i nic nie robiła. Autoryzacja (auth.uid()
-- musi być from_user lub to_user płatności) jest już sprawdzana wewnątrz
-- funkcji, więc SECURITY DEFINER nie otwiera nowej drogi nadużycia.

create or replace function public.delete_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
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
