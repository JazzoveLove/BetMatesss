# BetMates — Specyfikacja projektu dla Cursora

## Czym jest aplikacja

BetMates to mobilna aplikacja do zakładów towarzyskich między znajomymi. Użytkownicy zakładają się między sobą na własne gry (koszykówka 1v1, piłkarzyki, dart, szachy, poker, gry video, własne zakłady). Aplikacja śledzi stawki, wyniki i rozliczenia. **Brak integracji z bukmacherami. Brak obsługi płatności — tylko śledzenie kto komu ile jest winien.**

## Stos technologiczny

- React Native + Expo (TypeScript)
- Supabase (baza danych, auth, realtime)
- React Navigation (bottom tabs)
- Supabase Auth — email na MVP, SMS OTP w przyszłości

## Kolory (dark mode)

- Tło główne: #0f1117
- Tło kart: #181c24
- Tło elementów: #1e2330
- Akcent (fiolet): #534AB7
- Akcent jasny: #7F77DD
- Tekst główny: #e8e6e0
- Tekst drugorzędny: rgba(232,230,224,0.5)
- Zielony (wygrana): #1D9E75
- Czerwony (przegrana): #E24B4A
- Żółty (oczekuje): #EF9F27

## Struktura folderów

```
BetMates/
├── app/
│   ├── login.tsx          # ekran logowania
│   ├── dashboard.tsx      # główny dashboard
│   ├── new-bet.tsx        # kreator zakładu
│   ├── bet-detail.tsx     # szczegóły zakładu
│   ├── history.tsx        # historia zakładów
│   ├── friends.tsx        # znajomi i ranking
│   └── profile.tsx        # profil użytkownika
├── lib/
│   └── supabase.ts        # klient Supabase
├── components/
│   ├── BetCard.tsx        # karta zakładu
│   ├── StatCard.tsx       # karta statystyk
│   └── Avatar.tsx         # awatar użytkownika
└── App.tsx                # nawigacja + auth
```

## Nawigacja (bottom tab bar)

5 zakładek w kolejności:

1. **Home** — dashboard z bilansem i aktywnymi zakładami
2. **Historia** — wszystkie zakłady z filtrowaniem
3. **+ Nowy** — przycisk centralny wyróżniony kolorem #534AB7
4. **Znajomi** — lista znajomych i ranking
5. **Profil** — statystyki i ustawienia

## Tabele w bazie danych (Supabase)

```sql
users (id, phone, nick, avatar_url, created_at)
friendships (id, user_a, user_b, status, created_at)
bets (id, creator_id, game_template, format, stake_mode, status, notes, created_at)
bet_participants (id, bet_id, user_id, stake_amount, odds, role, confirmed)
bet_results (id, bet_id, match_number, scores jsonb, recorded_by, confirmed_by, created_at)
settlements (id, bet_id, debtor_id, creditor_id, amount, paid, paid_at)
sessions (id, creator_id, title, date, participants jsonb, created_at)
messages (id, bet_id, user_id, content, created_at)
notifications (id, user_id, type, payload jsonb, read, created_at)
```

## Typy zakładów

### Typ A — Pula równa

Wszyscy wrzucają tę samą kwotę. Zwycięzca bierze całą pulę.
Przykład: 3 osoby × 20 zł = pula 60 zł

### Typ B — Własny kurs (nierówne stawki)

Każdy stawia inną kwotę. Apka automatycznie wylicza kurs.
Przykład: Kuba 20 zł vs Marek 10 zł → kurs Kuby 1.50×, kurs Marka 3.00×
Wzór: kurs_gracza = suma_wszystkich_stawek / stawka_gracza

### Typ C — Typowanie

Każdy typuje kto wygra. Pula dzielona między tych co trafili.
Przykład: 4 osoby po 20 zł = 80 zł pula. 2 osoby trafiły → po 40 zł.

### Typ D — Bez stawki

Tylko dla statystyk, brak rozliczenia finansowego.

## Formaty rozgrywki

- **Jeden mecz** — jeden wynik rozstrzyga
- **Seria meczów** — kilka meczów, wygrywa kto ma więcej punktów łącznie
- **Round robin** — każdy gra z każdym, ranking po wszystkich meczach
- **Drużynowy** — zespoły 2v2 lub 3v3
- **Sesja** — kilka różnych dyscyplin w jednym wieczorze, każda to osobny zakład

## Szablony gier

Piłkarzyki, Ping pong, Dart (501/301), Koszykówka 1v1, Szachy, Poker, Gra video, Własna gra

## Ekran Dashboard (app/dashboard.tsx)

- Nagłówek: "Cześć, [nick]" + awatar
- 3 karty statystyk: bilans (zł), liczba zakładów, win rate (%)
- Sekcja "Aktywne zakłady" — lista BetCard z grą, przeciwnikiem, stawką i statusem
- Sekcja "Ostatnie wyniki" — ostatnie 3 rozegrane zakłady z wynikiem +/- zł
- Dane pochodzą z Supabase — tabele bets, bet_participants, settlements

## Komponent BetCard (components/BetCard.tsx)

Wyświetla pojedynczy zakład:

- Emoji gry + nazwa (np. 🏀 Koszykówka 1v1)
- Przeciwnik (nick)
- Stawka w zł
- Kurs
- Status badge: "aktywny" (fiolet), "oczekuje" (żółty), "wygrany" (zielony), "przegrany" (czerwony)

## Kreator zakładu — 3 kroki (app/new-bet.tsx)

Krok 1: Wybór gry (siatka kafelków z szablonami)
Krok 2: Format rozgrywki (lista z opisami)
Krok 3: Stawki i uczestnicy (kwoty, tryb stawek, podgląd puli)

## Rozliczenie po zakładzie

- Automatyczne obliczenie zwycięzcy po wpisaniu wyniku
- Lista "X jest winien Y kwotę Z"
- Przycisk "Zapłacono" — oznacza dług jako spłacony (tylko śledzenie, bez płatności)
- Przycisk "Przypomnij" — push notification do dłużnika
- Opcja zgłoszenia sporu

## Ważne zasady przy pisaniu kodu

1. Zawsze TypeScript (.tsx/.ts), nigdy .js/.jsx
2. Wszystkie kolory z palety powyżej — nigdy losowe kolory
3. Tło zawsze #0f1117, karty #181c24
4. Importy Supabase zawsze z '../lib/supabase' (z folderu app) lub './lib/supabase' (z App.tsx)
5. Brak prawdziwych danych sportowych — to NIE jest bukmacher
6. Dane użytkowników z Supabase auth.users, profile z tabeli users
7. Row Level Security (RLS) włączone na wszystkich tabelach

## Obecny stan aplikacji (co już działa)

- Logowanie i rejestracja przez email (Supabase Auth)
- Połączenie z Supabase
- Podstawowy dashboard (placeholder)
- Nawigacja App.tsx — po zalogowaniu pokazuje dashboard

## Co budujemy teraz (MVP)

1. Prawdziwy dashboard z danymi z Supabase
2. Kreator zakładu 1v1 (typ A — równe stawki, jeden mecz)
3. Wpisywanie wyników
4. Rozliczenie (kto komu ile)
5. Dodawanie znajomych przez link
