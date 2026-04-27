# BetMates — Ekrany

## Dashboard (app/dashboard.tsx)

```
Cześć, [nick] 👋        [awatar]

┌──────────┐ ┌──────────┐ ┌──────────┐
│  BILANS  │ │ ZAKŁADY  │ │ WIN RATE │
│  +20 zł  │ │    9     │ │   65%    │
└──────────┘ └──────────┘ └──────────┘

Aktywne zakłady
┌─────────────────────────────┐
│ ⚽ Piłkarzyki · vs Marek    │
│ Czeka na potwierdzenie  ⏳  │
└─────────────────────────────┘

Ostatnie mecze
┌─────────────────────────────┐
│ 🏀 Koszykówka · vs Marek    │
│ Wygrałeś 21:18      +20 zł │
└─────────────────────────────┘

Top rywalizacje
┌─────────────────────────────┐
│ [M] Marek · Piłkarzyki     │
│ 15W / 8L · 65%             │
└─────────────────────────────┘
```

**Elementy:**
- Nagłówek z nickiem + awatarem
- 3 karty statystyk: bilans (zł), liczba meczów, win rate
- Sekcja "Aktywne zakłady" — zakłady ze stawką pending/active
- Sekcja "Ostatnie mecze" — ostatnie 3 mecze (ze stawką lub bez)
- Skrót do top rywalizacji — tapnięcie → rivalry-detail.tsx

---

## Historia (app/history.tsx)

```
Historia

[ Wszystkie ] [ Aktywne ] [ Zakończone ]

┌─────────────────────────────┐
│ ⚽  Piłkarzyki              │
│     vs Marek · 3 dni temu   │
│     Wygrałeś 5:3    +20 zł  │
└─────────────────────────────┘
┌─────────────────────────────┐
│ 🏀  Koszykówka              │
│     vs Marek · wczoraj      │
│     Przegrałeś 18:21 -20 zł │
└─────────────────────────────┘
```

**Elementy:**
- Filtry: Wszystkie / Aktywne / Zakończone (tab bar u góry)
- Karty meczów: emoji + dyscyplina, vs nick, data, wynik, kwota +/-
- Pull-to-refresh
- Tapnięcie → bet-detail.tsx

---

## Kreator meczu (app/new-bet.tsx)

Patrz `cursor/rules/06 Creator flow.md` — pełna specyfikacja 4 kroków.

---

## Szczegóły zakładu (app/bet-detail.tsx)

Patrz `cursor/rules/07 Bet Flow.md` — widok per status.

Elementy wspólne dla wszystkich statusów:
- Header: emoji + dyscyplina + format + badge statusu
- Lista uczestników z awatarami, rolą i stawką
- Mini-czat (opcjonalnie — v1.1)

---

## Wpisywanie wyniku (app/enter-result.tsx)

Patrz `cursor/rules/07 Bet Flow.md` — komponenty ScoreInput, LegsInput, WinnerPicker, ChipCountInput.

Renderuje odpowiedni komponent na podstawie `game.resultType`:

```typescript
const game = GAME_TEMPLATES.find(g => g.id === bet.game_template)

return (
  <>
    {game.resultType === 'score' && <ScoreInput ... />}
    {game.resultType === 'legs' && <LegsInput ... />}
    {game.resultType === 'winner_only' && <WinnerPicker ... />}
    {game.resultType === 'chips' && <ChipCountInput ... />}
  </>
)
```

---

## Znajomi (app/friends.tsx)

```
Znajomi

┌─────────────────────────────┐
│ + Dodaj znajomego           │
└─────────────────────────────┘

Zaproszenia (2)
┌─────────────────────────────┐
│ [P] Piotrek chce Cię dodać  │
│ [ Akceptuj ] [ Odrzuć ]     │
└─────────────────────────────┘

Znajomi
┌─────────────────────────────┐
│ [M] Marek                   │
│     Bilans: +40 zł · 65%   →│
└─────────────────────────────┘
┌─────────────────────────────┐
│ [P] Piotrek                 │
│     Bilans: -20 zł · 40%   →│
└─────────────────────────────┘
```

**Elementy:**
- Przycisk "Dodaj znajomego" → modal (kod, nick, QR)
- Sekcja "Zaproszenia" — oczekujące na akceptację
- Lista znajomych z bilansmem i win rate
- Tapnięcie znajomego → rivalry-detail.tsx

**Dodawanie znajomego — modal:**
```
[ 🔍 Szukaj po nicku ]
[ 📱 Wyślij link     ]
[ 📷 Kod QR          ]
```

---

## Rywalizacja 1v1 (app/rivalry-detail.tsx)

```
← Marek Kowalski

⚽ Piłkarzyki
15W / 8L · 65% win rate
Bilans: +60 zł

Mecze
┌─────────────────────────────┐
│ Wygrałeś 5:3      3 dni temu│
│                      +20 zł │
└─────────────────────────────┘
┌─────────────────────────────┐
│ Przegrałeś 3:7   tydzień    │
│                      -20 zł │
└─────────────────────────────┘

[ + Nowy mecz z Markiem ]
```

**Elementy:**
- Nagłówek: awatar + nick znajomego
- Statystyki rywalizacji w tej dyscyplinie (W/L, win rate, bilans)
- Przełącznik dyscyplin (jeśli gracie w kilka gier)
- Lista wszystkich meczów tej rywalizacji
- Przycisk "Nowy mecz" → kreator z preselectedFriend

---

## Profil (app/profile.tsx)

```
[TO] testowy 01
     Dołączył: 20 kwietnia 2026

┌──────────┐ ┌──────────┐ ┌──────────┐
│  BILANS  │ │ ZAKŁADY  │ │ WIN RATE │
│  -15 zł  │ │    9     │ │   33%    │
└──────────┘ └──────────┘ └──────────┘

Wyniki wg dyscypliny
┌──────────────────────────────┐
│ DYSCYPLINA      W/L       %  │
│ ⚽ Piłkarzyki   15/8    65%  │
│ 🏀 Koszykówka   2/3     40%  │
│ 🎯 Dart         0/1      0%  │
└──────────────────────────────┘

Znajomi — ranking (bilans)
┌─────────────────────────────┐
│ 1  Marek          +40 zł    │
│ 2  Piotrek        +15 zł    │
│ 3  Tomek          -20 zł    │
└─────────────────────────────┘

[ Wyloguj ]
```

**Elementy:**
- Awatar (inicjały lub zdjęcie) + nick + data dołączenia
- 3 karty statystyk
- Tabela wyników per dyscyplina
- Ranking znajomych po bilansie
- Przycisk wyloguj

**Ważne:** ScrollView z `contentContainerStyle={{ paddingBottom: 40 }}` żeby "Wyloguj" nie był przycięty.

---

## Login / Setup (app/login.tsx, app/setup-profile.tsx)

Każdy ekran z inputami musi używać KeyboardAvoidingView (patrz `cursor/rules/02 Architecture.md`).

Login:
- Pole email
- Pole hasło
- Przycisk "Zaloguj się"
- Link "Nie masz konta? Zarejestruj się"

Setup profilu (po pierwszym logowaniu):
- Pole nick (max 20 znaków)
- Awatar — inicjały generowane automatycznie lub zdjęcie z galerii
- Przycisk "Gotowe"