-- can_see_user zwracała SQL NULL zamiast false, gdy auth.uid() jest NULL
-- (rola anon, brak JWT) — pierwszy człon funkcji to gołe
-- `p_target = auth.uid()`, a `x = NULL` w trójwartościowej logice SQL zawsze
-- daje NULL, nie false. Dwa pozostałe człony (EXISTS) poprawnie dają false,
-- ale `NULL OR false OR false = NULL`.
--
-- Zweryfikowane empirycznie (audyt 19.08.2026), że to nie powodowało realnej
-- luki: jedyne miejsca użycia can_see_user to `using (...)`/`with check
-- (...)` w politykach RLS (users_select, notifications_insert), gdzie
-- Postgres jawnie traktuje NULL tak samo jak false — wiersz i tak jest
-- odrzucany. Ale to bezpieczeństwo było przypadkowym efektem ubocznym
-- kontekstu wywołania (RLS), nie właściwością samej funkcji — gdyby ktoś
-- kiedyś użył can_see_user poza klauzulą RLS (np. w PL/pgSQL
-- `if not can_see_user(...) then ...`), NULL zachowywałby się inaczej niż
-- dosłowne false (`not null` = `null`, gałąź `if` w ogóle by się nie
-- wykonała). coalesce(..., false) usuwa tę zależność od kontekstu: funkcja
-- teraz zawsze zwraca dosłowne true/false, nigdy NULL. Sama treść warunków
-- — kto kogo widzi — jest identyczna, zero zmian w logice widoczności.

create or replace function public.can_see_user(p_target uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  select coalesce(
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
    ),
    false
  );
$function$;
