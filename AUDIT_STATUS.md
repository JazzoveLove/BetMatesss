# Status audytu z 15.08.2026

Śledzenie postępu napraw ze "BetMates — pełny audyt repo i bazy" (15.08.2026).
Aktualizowane na bieżąco przy każdej naprawie. Numeracja punktów zgodna z oryginalnym audytem.

## Zrobione

| # | Znalezisko | Jak naprawione |
|---|---|---|
| P0-1/P0-2 | Osierocone powiadomienia `bet_invite` powodowały błąd "Odrzuć" | `notifications.service.ts`: `getPendingBetInviteNotifications` filtruje teraz po `bets.status='pending'` + `bet_participants.confirmed=false`. 3 osierocone wiersze w prod oznaczone `read=true`. |
| P0-3 | Nadawca mógł sam zaakceptować własne zaproszenie do znajomych | Migracja `20260818100000` — trigger `prevent_friendships_protected_field_change` blokuje zmianę `status` poza `pending→accepted` wykonaną przez `user_b`. |
| P0-4 | `delete_payment` cicho nic nie robił (brak `SECURITY DEFINER`) | Migracja `20260818100100` — funkcja ma teraz `SECURITY DEFINER`. |
| P0-5 | Historia migracji Supabase rozjechana z repo | Wpisy dla wszystkich 4+ plików w repo dograne ręcznie do `supabase_migrations.schema_migrations`. Od teraz każda zmiana idzie przez plik w `supabase/migrations/` **i** zostaje zarejestrowana w historii (patrz sekcja niżej). |
| P1-1 | Każdy uczestnik mógł ustawić dowolny status zakładu | Migracja `20260818100200` — whitelist dozwolonych przejść w `prevent_bets_protected_field_change` + wymóg potwierdzonego wyniku dla przejścia do `completed`. Przetestowane na żywo (impersonacja roli). |
| P1-2 | Każdy widoczny użytkownik mógł wstawić Ci powiadomienie (spoofing/spam) | Migracja `20260818100300` — `notifications_insert` wymaga `fromUserId=auth.uid()` i realnego, świeżego zaproszenia w `bet_participants`; unikalny indeks blokuje duplikaty. Przetestowane na żywo pod rolą `authenticated`. |
| P1-4 | Martwy kod formatu `per_match` | Usunięty z aplikacji między audytem a 16.08 (poza tego commity). |
| P1-5 | `useBets` nasłuchiwał całą tabelę `bets` | Naprawione 16.08 — kanał per-user, filtrowany po ID zakładów. |
| P1-6 | Trzy niezależne implementacje logiki rozliczeń | Zredukowane do jednej (`createSettlementsFromWinner`) między audytem a 16.08. |
| P1-8 | 21+ polityk RLS re-ewaluowało `auth.uid()` per wiersz | Migracja `20260818100400` — wszystkie zgłoszone przez advisora polityki (22, w tym świeża `notifications_insert`) przepisane z `(select auth.uid())`. Advisor czysty, dostęp zweryfikowany testem pod impersonacją roli. |
| P2-1 | `AuthContext.checkProfile` mógł zapisać nieaktualny stan po `await` | Zweryfikowane 18.08 — flaga `cancelled` już sprawdzana przed i po `await`, naprawione między audytem a 16.08. |
| P2-2 | `getInitials` w 5 niezależnych implementacjach | Skonsolidowane do `shared/utils/text.ts` między audytem a 16.08. Kolizja `makaka1`/`makaka2` → "MA"/"MA" naprawiona 18.08: pierwszy+ostatni znak zamiast pierwszych dwóch (`M1`/`M2`). |
| P2-3 | Komentarze-notatki w kodzie produkcyjnym | Zweryfikowane 18.08 — zero trafień w repo, naprawione między audytem a 16.08. |
| P2-4 | Nadmiar `log()` w ścieżce rozliczeń | Zweryfikowane 18.08 — 0 wywołań `log()` w `settlements.create.winner.ts`/`settlements.read.ts`, naprawione między audytem a 16.08. |

## Do zrobienia

### P1-3 — Brak profilu `development` w `eas.json`
`eas.json` ma tylko `preview`/`production`. Dodatkowo **`expo-dev-client` nie jest w ogóle zainstalowany** w `package.json` — sam wpis w `eas.json` nie wystarczy, bez tego pakietu `developmentClient: true` nie daje właściwego dev-clienta (deep-linki, QR, dev menu).

Do zrobienia:
1. `npx expo install expo-dev-client` (dobiera wersję zgodną z Expo SDK 54)
2. Dodać do `eas.json` → `build`:
   ```json
   "development": {
     "developmentClient": true,
     "distribution": "internal"
   }
   ```

### P1-7 — Ochrona przed wyciekłymi hasłami wyłączona
Advisor Supabase (`auth_leaked_password_protection`) nadal WARN. Jeden przełącznik, zero kodu:

**Supabase Dashboard → projekt `gdmovzmxwnoazfwzegxl` → Authentication → Policies → sekcja "Password Security" → włącz "Leaked password protection"**

Świadomie odłożone — niski priorytet przy obecnej skali (8 userów, znajomi), ale zero kosztu jak się w końcu zrobi.

### P2 — pozostałe
- **P2-5** 9 nieużywanych indeksów — nie ruszać teraz, sprawdzić po realnym ruchu
- **P2-6** `payments`/`settlements` bez polityk UPDATE/DELETE — udokumentować jako świadomą decyzję (dla `settlements` już jest; dla `payments` P0-4 to załatwiło pośrednio przez RPC)
- **Do rozważenia (nieblokujące)** `anon` ma GRANT ALL na poziomie SQL na wszystkich tabelach, jedyną linią obrony jest RLS — standardowy wzorzec Supabase, ale przy projekcie, który już raz miał realną lukę RLS (P0-3), warto rozważać w przyszłości zawężanie GRANT-ów jako drugiej warstwy obrony, nie tylko RLS.

### Testy — stan na 18.08 wieczór

Napisane i **zweryfikowane mutation-testingiem** (świadomie zepsuty kod → test poszedł czerwony →
przywrócone): `notifications.service.getPendingBetInviteNotifications` (7 testów, chroni P0-1/P0-2)
i `useBetInvites` accept/reject (4 testy, chroni sekwencję efektów ubocznych — nie oznacz zaproszenia
jako obsłużonego, jeśli operacja w bazie się nie udała).

Przy pisaniu wypłynęły dwie realne wady infrastruktury testowej, obie naprawione:
- `@sentry/react-native` rejestrował `setInterval` przy imporcie `logger.ts` → każdy test dotykający
  loggera zostawiał Jestowi otwarty handle ("did not exit"). Fix: globalny mock Sentry w `jest.setup.ts`.
- Zagnieżdżony, nieśledzony katalog `betmates-portfolio/` powodował Haste collision i najpewniej
  odpowiadał za nieregularne ~150s cold-starty. Fix: `testPathIgnorePatterns`/`modulePathIgnorePatterns`
  w `package.json`. Po obu fixach: 18 suite / 138 testów, 4.7s.

Dostaliśmy też zewnętrzny dokument ("Architektura testów — BetMates") krytykujący pozycyjny mock
Supabase (`mockReturnValueOnce` w kolejności wywołań) jako sprzężony z implementacją, z przykładem
`expect(mockFrom).toHaveBeenCalledTimes(3)` w `settlements.create.test.ts` — **zweryfikowane, obecne
w repo, krytyka trafna**. Zrobiliśmy z tym eksperyment zamiast od razu przebudowywać mock: usunęliśmy
3 analogiczne asercje `toHaveBeenCalledTimes` z nowych testów `notifications.service` i
mutation-testingiem potwierdziliśmy, że **nie miały żadnej wartości wykrywającej** — asercja na
wyniku (`expect(result).toEqual(...)`) już łapała każdą zepsutą regresję wcześniej niż asercja na
liczbie wywołań. Wniosek: pozycyjny mock **na razie** nie produkuje fałszywie zielonych testów w tym,
co napisaliśmy — więc przebudowa na mock tabelaryczny (patrz dokument, sekcja 3a/3b) została odłożona
jako decyzja do podjęcia z dowodami, nie z góry, zgodnie z zasadą "napisz gdy refaktor faktycznie
zepsuje test", a nie jako blokujący fundament. Dokument sam zaznacza, że bazuje na snapshoty
`betmates-portfolio`, nie na `Desktop/BetMatesss` — do zweryfikowania punkt po punkcie, nie brać
sekcji 5 (priorytety) jako gotowego planu bez sprawdzenia.

Reguła robocza od teraz (**definition of done dla nowego testu**, z dokumentu, punkt 7): test musi
paść, gdy celowo zepsujesz logikę, którą ma chronić. Sprawdzać to za każdym razem, nie zakładać.

Wciąż bez pokrycia: `useDashboard`, `useProfile`, `useFriends`, `useBetDetail*`, `useNewBet*`,
`useSettlePayment`, `friend-detail`, `users.service`, komponenty ekranowe, `disputeBetResult`/
`cancelDisputedBet` (zero pokrycia, ścieżka sporu o pieniądze).

### Bonus (spoza oryginalnego audytu, znaleziony przez advisor Supabase)
5 funkcji `SECURITY DEFINER` wywoływalnych przez `authenticated`: `can_see_user`, `delete_my_account`, `is_bet_participant`, `lookup_user_by_invite_code`, `user_exists_for_friend_invite`. Prawdopodobnie celowe (to fundament architektury RLS tej apki), ale nie zostało to jawnie potwierdzone jako świadoma decyzja — warto się temu przyjrzeć przy okazji.

## Migracje z tej sesji naprawczej (18.08.2026)

Wszystkie odpalone ręcznie w SQL editorze i zarejestrowane w `supabase_migrations.schema_migrations`:

- `20260818100000_friendships_restrict_status_change_to_recipient.sql`
- `20260818100100_delete_payment_security_definer.sql`
- `20260818100200_bets_restrict_status_transitions.sql`
- `20260818100300_notifications_restrict_bet_invite_insert.sql`
- `20260818100400_rls_wrap_auth_uid_in_initplan.sql`
