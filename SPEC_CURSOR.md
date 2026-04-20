# BetMates — Specyfikacja projektu dla Cursora

## Czym jest aplikacja

BetMates to mobilna aplikacja która łączy dwie rzeczy:
1. **Tracker rywalizacji** — historia meczów, statystyki, kto jest lepszy w czym w grupie znajomych
2. **Tracker zakładów** — opcjonalne stawki finansowe, rozliczenia kto komu ile winien

Użytkownik może dodać mecz bez stawki (tylko statystyki) ALBO z stawką (rozliczenie finansowe). Oba tryby są równoważne. Brak integracji z bukmacherami. Brak obsługi płatności.

### Dwa tryby tworzenia meczu

| Tryb | Opis | Kiedy |
|------|------|-------|
| Bez stawki (default) | Tylko statystyki i historia rywalizacji. Zero rozliczeń finansowych. | Codzienne mecze ze znajomymi |
| Ze stawką | Wszystko z trybu bez stawki + stawka finansowa + rozliczenie kto komu ile winien. | Gdy gra się o pieniądze |

---

## Stos technologiczny

| Technologia | Rola |
|-------------|------|
| React Native + Expo | Framework aplikacji iOS + Android (TypeScript) |
| Supabase PostgreSQL | Baza danych |
| Supabase Auth | Logowanie — email (MVP), SMS OTP (v1.1) |
| Supabase Realtime | Synchronizacja na żywo między graczami |
| React Navigation | Nawigacja między ekranami (bottom tabs) |
| Zustand | Zarządzanie stanem aplikacji |

---

## Kolory (dark mode — ZAWSZE używaj tych wartości)

| Nazwa | Hex | Użycie |
|-------|-----|--------|
| Tło główne | `#0f1117` | Tło ekranów |
| Tło kart | `#181c24` | Karty, listy |
| Tło elementów | `#1e2330` | Inputy, modale |
| Akcent fiolet | `#534AB7` | Przyciski, aktywne elementy |
| Akcent jasny | `#7F77DD` | Linki, ikony, tekst akcentowany |
| Tekst główny | `#e8e6e0` | Tytuły, treść |
| Tekst drugorzędny | `rgba(232,230,224,0.5)` | Opisy, daty, metadane |
| Zielony (wygrana) | `#1D9E75` | Wygrana, bilans dodatni, sukces |
| Czerwony (przegrana) | `#E24B4A` | Przegrana, bilans ujemny, błąd |
| Żółty (oczekuje) | `#EF9F27` | Status oczekujący, stawka |

---

## Struktura folderów

```
BetMates/
├── app/                          # Ekrany — tylko UI
│   ├── login.tsx
│   ├── setup-profile.tsx
│   ├── dashboard.tsx
│   ├── new-bet.tsx
│   ├── bet-detail.tsx
│   ├── history.tsx
│   ├── friends.tsx
│   └── profile.tsx
│
├── components/                   # Komponenty UI wielokrotnego użytku
│   ├── BetCard.tsx
│   ├── Avatar.tsx
│   ├── StatCard.tsx
│   ├── Badge.tsx
│   ├── PlayerRow.tsx
│   ├── MatchRow.tsx
│   └── RivalryCard.tsx
│
├── services/                     # Komunikacja z Supabase — TYLKO tutaj
│   ├── auth.service.ts
│   ├── bets.service.ts
│   ├── results.service.ts
│   ├── settlements.service.ts
│   ├── users.service.ts
│   ├── friends.service.ts
│   └── notifications.service.ts
│
├── hooks/                        # Logika wielokrotnego użytku + stan
│   ├── useAuth.ts
│   ├── useBets.ts
│   ├── useBetDetail.ts
│   ├── useHistory.ts
│   ├── useProfile.ts
│   └── useFriends.ts
│
├── utils/                        # Czyste funkcje bez efektów ubocznych
│   ├── odds.ts
│   ├── settlements.ts
│   ├── formats.ts
│   ├── bracket.ts
│   └── date.ts
│
├── types/                        # Typy TypeScript
│   ├── bet.types.ts
│   ├── user.types.ts
│   ├── session.types.ts
│   └── navigation.types.ts
│
├── constants/                    # Stałe wartości
│   ├── colors.ts
│   ├── games.ts
│   └── formats.ts
│
└── lib/
    └── supabase.ts               # Tylko klient Supabase
```

### Zasady warstw

| Folder | Odpowiedzialność | Zasada |
|--------|-----------------|--------|
| `app/` | Ekrany — tylko UI | NIE komunikuje się z Supabase bezpośrednio |
| `components/` | Komponenty UI wielokrotnego użytku | Małe, reużywalne, bez logiki biznesowej |
| `services/` | Komunikacja z Supabase | TYLKO tutaj są zapytania do bazy |
| `hooks/` | Logika + stan wielokrotnego użytku | Łączą services z ekranami |
| `utils/` | Czyste funkcje bez efektów | Obliczenia kursów, rozliczeń, formatowania |
| `types/` | Typy TypeScript | Wszystkie typy tutaj, nie inline w ekranach |
| `constants/` | Stałe wartości | Kolory, szablony gier, formaty |
| `lib/supabase.ts` | Klient Supabase | Tylko inicjalizacja, nic więcej |

---

## Tabele w bazie danych (Supabase)

| Tabela | Kluczowe pola | Opis |
|--------|--------------|------|
| `users` | id, nick, avatar_url, created_at | Profile użytkowników |
| `friendships` | id, user_a, user_b, status | Relacje między użytkownikami |
| `rivalries` | id, game_template, participant_ids uuid[] | Rywalizacja = gracze + dyscyplina |
| `bets` | id, creator_id, rivalry_id, game_template, format, stake_mode, status | Zakłady / mecze |
| `bet_participants` | id, bet_id, user_id, stake_amount, odds, role, confirmed | Uczestnicy zakładu |
| `bet_results` | id, bet_id, winner_id, scores jsonb, confirmed, confirmed_by | Wyniki meczów |
| `settlements` | id, bet_id, debtor_id, creditor_id, amount, paid, paid_at | Rozliczenia finansowe |
| `sessions` | id, creator_id, title, date, participants jsonb | Sesje wielu gier |
| `messages` | id, bet_id, user_id, content | Czat przy zakładzie |
| `notifications` | id, user_id, type, payload jsonb, read | Historia powiadomień |

---

## Logika rywalizacji (KLUCZOWE)

Rywalizacja = konkretna kombinacja graczy + dyscyplina. Tworzy się automatycznie przy pierwszym meczu i rośnie w czasie.

```
Przykład:
Kuba i Marek grają w koszykówkę w poniedziałek i czwartek.
→ Oba mecze należą do tej samej rywalizacji "Kuba+Marek w koszykówce".
→ Widać: 2 mecze, Kuba 1W/1L, Marek 1W/1L, z datami.

Kuba, Marek i Piotrek grają w bilarda — osobna rywalizacja (inny skład).
Kuba i Marek grają w bilarda (bez Piotrka) — jeszcze inna rywalizacja.
```

### Jak identyfikować rywalizację

1. Posortuj UUID uczestników alfabetycznie → to jest klucz
2. Sprawdź czy istnieje rywalizacja z tym samym `game_template` i tymi samymi `participant_ids`
3. Jeśli tak → przypisz `rivalry_id` do nowego zakładu
4. Jeśli nie → utwórz nową rywalizację, potem przypisz

### Dwa poziomy widoku

| Poziom | Co pokazuje | Gdzie |
|--------|------------|-------|
| Rywalizacja konkretna | Historia meczów dokładnie tego składu w tej dyscyplinie | Ekran szczegółów rywalizacji |
| Statystyki ogólne | Win rate gracza w danej dyscyplinie niezależnie z kim grał | Profil, ekran znajomego |

---

## Nawigacja (bottom tab bar)

| Tab | Zawartość |
|-----|-----------|
| Home | Bilans, aktywne zakłady, ostatnie mecze, skrót do top rywalizacji |
| Historia | Wszystkie mecze i zakłady z filtrowaniem (Wszystkie / Aktywne / Zakończone) |
| + Nowy (centralny) | Kreator meczu/zakładu — 3 kroki |
| Znajomi | Lista znajomych, rywalizacje 1v1, ranking grupy |
| Profil | Statystyki osobiste, wyniki per dyscyplina, ranking wśród znajomych |

---

## Opis ekranów

### Dashboard (`app/dashboard.tsx`)
- Nagłówek: "Cześć, [nick]" + awatar użytkownika
- 3 karty statystyk: bilans (zł), liczba meczów, win rate (%)
- Sekcja "Aktywne zakłady" — zakłady ze stawką czekające na rozstrzygnięcie
- Sekcja "Ostatnie mecze" — ostatnie 3 mecze (ze stawką lub bez)
- Skrót do top rywalizacji — np. "Marek: 5W/3L w piłkarzyki"

### Historia (`app/history.tsx`)
- Lista wszystkich meczów i zakładów użytkownika
- Filtry: Wszystkie / Aktywne / Zakończone
- Każda karta: emoji gry, vs [nick], data, badge statusu, kwota +/- zł
- Mecze z tej samej rywalizacji grupowane razem
- Pull-to-refresh, tap → `bet-detail.tsx`

### Kreator meczu (`app/new-bet.tsx` — 3 kroki)

| Krok | Co wybiera użytkownik |
|------|----------------------|
| 1/3 — Gra | Szablon gry (siatka kafelków) lub Własna gra |
| 2/3 — Format | Jeden mecz / Seria / Best of X / Round robin / Drużynowy / Sesja |
| 3/3 — Stawki | Tryb: Bez stawki (default) / Równe / Własny kurs. Uczestnicy z listy znajomych lub przez link/QR. |

### Szczegóły zakładu (`app/bet-detail.tsx`)
- Nagłówek: gra + format + status badge
- Lista uczestników z rolą, potwierdzeniem i stawką
- Dla statusu `active` + creator: przycisk "Wpisz wynik" → modal z polem wyniku i wyborem zwycięzcy
- Dla statusu `awaiting_confirmation` + nie-creator: przyciski "Potwierdź wynik" i "Zgłoś spór"
- Dla statusu `completed`: sekcja ROZLICZENIE z listą długów i przyciskiem "Zapłacono"

### Znajomi (`app/friends.tsx`)
- Lista zaakceptowanych znajomych z bilansum między wami i win rate
- Sekcja "Zaproszenia do zakładów" — oczekujące na akceptację
- Dodawanie znajomych: przez kod, przez nick, QR kod
- Kliknięcie znajomego → ekran rywalizacji 1v1

### Profil (`app/profile.tsx`)
- Awatar z inicjałami, nick, data dołączenia
- 3 karty: bilans zł, liczba meczów, win rate %
- Tabela "Wyniki wg dyscypliny": emoji + nazwa + W/L + %
- Ranking znajomych posortowany po bilansie
- Przycisk wyloguj

---

## Szablony gier

| ID | Nazwa | Emoji |
|----|-------|-------|
| `pilkarzyki` | Piłkarzyki | ⚽ |
| `ping_pong` | Ping pong | 🏓 |
| `dart` | Dart | 🎯 |
| `koszykowka` | Koszykówka 1v1 | 🏀 |
| `bilard` | Bilard | 🎱 |
| `szachy` | Szachy | ♟️ |
| `poker` | Poker | 🃏 |
| `gra_video` | Gra video | 🎮 |
| `wlasna` | Własna gra | ✏️ |

---

## Formaty rozgrywki

| ID | Nazwa | Opis |
|----|-------|------|
| `single` | Jeden mecz | Jeden wynik rozstrzyga. Np. 5:3. |
| `per_match` | Zakład za mecz | Każdy mecz osobna stawka. Grasz ile chcesz. |
| `best_of` | Best of X | Best of 3/5/7. Wygrywa kto pierwszy dobije wymaganą liczbę. |
| `round_robin` | Round robin | Każdy gra z każdym. Ranking po wszystkich meczach. |
| `team` | Drużynowy | Zespoły 2v2 lub 3v3. Wynik drużyny się sumuje. |
| `session` | Sesja wielu gier | Kilka dyscyplin w jednym wieczorze. Każda osobny zakład. |

---

## Tryby stawek

| Tryb | ID | Opis | Przykład |
|------|----|------|---------|
| Bez stawki | `none` | Tylko statystyki. Zero rozliczeń. **DEFAULT.** | Codzienne mecze |
| Równe | `equal` | Wszyscy wrzucają tę samą kwotę. | 3 osoby × 20 zł = 60 zł pula |
| Własny kurs | `custom` | Każdy stawia inną kwotę. Kurs = suma/stawka. | Kuba 20 zł vs Marek 10 zł → kursy 1.50× i 3.00× |

---

## Pełny flow zakładu

1. Gracz A tworzy zakład (3 kroki w kreatorze)
2. Gracz A zaprasza uczestników (z listy znajomych / link / QR)
3. Gracz B dostaje powiadomienie push i widzi zaproszenie w zakładce Znajomi
4. Gracz B otwiera szczegóły zakładu — widzi grę, format, stawkę
5. Gracz B klika "Akceptuję" lub "Odrzucam"
6. Po akceptacji wszystkich → `bets.status = 'active'`, Realtime odświeża UI u Gracza A
7. Gracz A (creator) wpisuje wynik po meczu → modal z wynikiem i wyborem zwycięzcy
8. `bets.status = 'awaiting_confirmation'`, Gracz B widzi prośbę o potwierdzenie
9. Gracz B klika "Potwierdź" lub "Zgłoś spór"
10. Po potwierdzeniu → `bets.status = 'completed'`, tworzone są settlements
11. Sekcja ROZLICZENIE pokazuje kto komu ile winien + przycisk "Zapłacono"

---

## Zasady dla Cursora — ZAWSZE przestrzegaj

| # | Zasada |
|---|--------|
| 1 | Zawsze TypeScript (`.tsx`/`.ts`) — nigdy `.js`/`.jsx` |
| 2 | Kolory TYLKO z `constants/colors.ts` — nigdy hardcodowane stringi hex |
| 3 | Tło zawsze `#0f1117`, karty `#181c24` — bez wyjątków |
| 4 | `supabase.from()` TYLKO w plikach `services/` — nigdy w `app/` ani `components/` |
| 5 | Każdy serwis eksportuje obiekt z nazwanymi funkcjami (nie default export) |
| 6 | Każdy hook zwraca `loading` i `error` oprócz danych |
| 7 | Wszystkie typy w `types/` — nie twórz typów inline w ekranach |
| 8 | `stake_mode='none'` = mecz bez stawki (default przy tworzeniu) |
| 9 | Tryb bez stawki jest równie ważny jak tryb ze stawką |
| 10 | Przy tworzeniu zakładu zawsze sprawdź/utwórz `rivalry_id` |
| 11 | BetMates NIE jest bukmacherem — zero danych sportowych z zewnątrz |
| 12 | Nazwy plików: ekrany kebab-case (`new-bet.tsx`), serwisy camelCase (`bets.service.ts`), typy PascalCase |

---

## Obecny stan aplikacji

### Co już działa
- Logowanie i rejestracja przez email (Supabase Auth)
- Setup profilu (nick, awatar z inicjałów)
- Dashboard z bilansem, aktywnymi zakładami i ostatnimi wynikami
- Kreator zakładu — 3 kroki (gra, format, stawki)
- System znajomych — dodawanie przez kod, nick, QR
- Zaproszenia do zakładów z listy znajomych, przez link i QR
- Akceptacja / odrzucenie zakładu przez drugiego gracza
- Realtime — automatyczne odświeżanie statusu między graczami
- Wpisywanie wyniku przez organizatora
- Potwierdzenie wyniku przez drugiego gracza
- Historia zakładów z filtrowaniem
- Profil z statystykami per dyscyplina i rankingiem znajomych

### Co budujemy teraz (priorytety)
1. Naprawić rozliczenia finansowe — sekcja ROZLICZENIE po potwierdzeniu wyniku
2. Logika rywalizacji — `rivalry_id` przy tworzeniu zakładu
3. Ekran rywalizacji 1v1 — historia meczów między dwoma graczami
4. Szybkie dodanie meczu bez stawki jako domyślny flow
5. Ranking grupy znajomych per dyscyplina