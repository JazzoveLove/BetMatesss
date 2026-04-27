# BetMates — Architektura

> Plik reguł: `cursor/rules/02 Architecture.md`

## Zasada nadrzędna

Ekrany (app/) tylko wyświetlają dane i reagują na akcje użytkownika.
Ekrany NIE komunikują się z Supabase bezpośrednio.
Cała logika biznesowa i komunikacja z bazą danych jest POZA ekranami.

---

## Struktura folderów

```
BetMates/
├── app/                        # Ekrany — TYLKO UI
│   ├── login.tsx
│   ├── setup-profile.tsx
│   ├── dashboard.tsx
│   ├── new-bet.tsx             # Kreator meczu — 4 kroki
│   ├── bet-detail.tsx          # Szczegóły zakładu
│   ├── enter-result.tsx        # Wpisywanie wyniku
│   ├── history.tsx
│   ├── friends.tsx
│   ├── rivalry-detail.tsx      # Historia rywalizacji 1v1
│   └── profile.tsx
│
├── components/                 # Komponenty UI wielokrotnego użytku
│   ├── BetCard.tsx
│   ├── Avatar.tsx
│   ├── StatCard.tsx
│   ├── Badge.tsx
│   ├── PlayerRow.tsx
│   ├── MatchRow.tsx
│   ├── OddsPreview.tsx         # Podgląd kursów (własny kurs)
│   ├── ProgressBar.tsx
│   └── LoadingScreen.tsx
│
├── components/result-inputs/   # Komponenty wpisywania wyniku
│   ├── ScoreInput.tsx          # X:Y (piłkarzyki, ping pong, koszykówka)
│   ├── LegsInput.tsx           # Lista legów (dart)
│   ├── WinnerPicker.tsx        # Kto wygrał (szachy, bilard, poker WTA)
│   └── ChipCountInput.tsx      # Żetony (poker chip_count)
│
├── services/                   # Komunikacja z Supabase — TYLKO TUTAJ
│   ├── auth.service.ts
│   ├── bets.service.ts
│   ├── results.service.ts
│   ├── settlements.service.ts
│   ├── users.service.ts
│   ├── friends.service.ts
│   ├── rivalries.service.ts
│   ├── sessions.service.ts
│   └── notifications.service.ts
│
├── hooks/                      # Logika + stan
│   ├── useAuth.ts
│   ├── useBets.ts
│   ├── useBetDetail.ts         # Realtime
│   ├── useFriends.ts
│   ├── useRivalry.ts
│   └── useProfile.ts
│
├── utils/                      # Czyste funkcje — tylko obliczenia
│   ├── odds.ts                 # Obliczanie kursów
│   ├── settlements.ts          # Obliczanie rozliczeń
│   ├── formats.ts              # Logika formatów + filtrowanie
│   ├── bracket.ts              # Generowanie drabinki
│   └── date.ts                 # Formatowanie dat po polsku
│
├── types/                      # Typy TypeScript
│   ├── bet.types.ts
│   ├── user.types.ts
│   ├── session.types.ts
│   └── navigation.types.ts
│
├── constants/                  # Stałe wartości
│   ├── colors.ts
│   ├── games.ts                # GAME_TEMPLATES
│   └── formats.ts              # BET_FORMATS
│
└── lib/
    └── supabase.ts             # Tylko inicjalizacja klienta
```

---

## Warstwy

### app/ — ekrany (tylko UI)

**Wolno:**
- Importować hooki z `hooks/`
- Importować komponenty z `components/`
- Importować stałe z `constants/`
- Nawigować między ekranami
- Trzymać lokalny stan UI (modal otwarty/zamknięty itp.)

**NIE wolno:**
- Importować supabase bezpośrednio
- Pisać `.from().select()`
- Obliczać kursów ani rozliczeń
- Trzymać logiki biznesowej

```typescript
// ✅ DOBRZE
const { createBet, loading } = useBets()
await createBet({ game, format, participants, stakeMode })

// ❌ ŹLE
const { data } = await supabase.from('bets').insert({ ... })
```

### services/ — tylko tutaj Supabase

Każdy serwis eksportuje obiekt z nazwanymi funkcjami (NIE default export).
Serwisy zwracają dane lub rzucają błędy — nie zarządzają stanem UI.

### hooks/ — łączą services z ekranami

Każdy hook zwraca `{ data, loading, error }` + funkcje.
Hooki zarządzają stanem ładowania i błędami.
Realtime subskrypcje w hookach z cleanup w useEffect.

```typescript
// Poprawny pattern Realtime w hooku
useEffect(() => {
  const channel = supabase
    .channel(`bet-${betId}`)
    .on('postgres_changes', { ... }, handler)
    .subscribe()                    // subscribe() ZAWSZE na końcu

  return () => supabase.removeChannel(channel)  // cleanup
}, [betId])
```

### utils/ — czyste funkcje

Zero Supabase, zero efektów ubocznych. Tylko obliczenia.
Można testować bez telefonu i bez bazy danych.

### KeyboardAvoidingView — na każdym ekranie z inputami

```typescript
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'

<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
  <ScrollView
    contentContainerStyle={{ flexGrow: 1 }}
    keyboardShouldPersistTaps="handled"
  >
    // zawartość
  </ScrollView>
</KeyboardAvoidingView>
```

### SafeAreaView + paddingBottom

Każdy ekran ze ScrollView musi mieć `contentContainerStyle={{ paddingBottom: 40 }}` żeby ostatni element nie był przycięty przez bottom tab bar.