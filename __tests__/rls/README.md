# Testy RLS

Skrypty w tym katalogu **nie są częścią `npm test`** (Jest) i nie są przez niego
odkrywane — RLS/triggery Postgresa działają tylko na prawdziwej bazie, nie da
się ich sensownie sprawdzić przez mock `supabase-js` używany w `__tests__/`
dla reszty testów.

## Wymagania

Lokalna instancja Supabase musi działać:

```
npx supabase start
```

## Uruchomienie

```
npm run test:rls
```

Skrypt (`run.js`) łączy się z lokalnym REST endpointem (`http://127.0.0.1:54321`
domyślnie, nadpisywalne przez `SUPABASE_URL`/`SUPABASE_ANON_KEY`/
`SUPABASE_SERVICE_ROLE_KEY`) jako prawdziwi, zalogowani użytkownicy — tworzy
ich przez `auth.admin.createUser` (klient service_role, omija RLS przy
zakładaniu fixture'ów), loguje realną sesją (`signInWithPassword`), i dopiero
tą sesją wykonuje operację pod testem. To sprawdza faktyczne działanie RLS /
triggerów na Postgresie, nie zachowanie mocka.

Zakres na start (trzy najważniejsze reguły, nie pełne pokrycie):

1. **P1-1** — uczestnik zakładu nie może ustawić `bets.status` wprost na
   `'completed'` z pominięciem flow wyniku (`active -> completed` nie ma być
   w białej liście dozwolonych przejść).
2. **P0-3** — nadawca zaproszenia do znajomych nie może sam zaakceptować
   własnego zaproszenia (`friendships_update` musi wymagać, żeby akceptował
   odbiorca, nie nadawca).
3. Użytkownik spoza rozliczenia/płatności nie widzi jej przez `SELECT` — RLS
   ma zwrócić pustą tablicę, nie błąd (`settlements` i `payments`).

Każde uruchomienie tworzy świeżych, unikalnych testowych użytkowników (e-mail
z losowym sufiksem) — bezpiecznie odpalać wielokrotnie na tej samej lokalnej
bazie bez restartu.

## Rozszerzanie

Kolejne reguły RLS dopisuj jako kolejne funkcje `checkXxx(adminClient)` w
`run.js` i wołaj je w `main()`. Skrypt kończy się kodem wyjścia `1`, jeśli
którakolwiek asercja nie przeszła.
