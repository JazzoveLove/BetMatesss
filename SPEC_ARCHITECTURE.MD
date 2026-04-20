# BetMates — Specyfikacja architektury projektu

## Zasada nadrzędna
Ekrany (app/) tylko wyświetlają dane i reagują na akcje użytkownika.
Ekrany NIE komunikują się z Supabase bezpośrednio.
Cała logika biznesowa i komunikacja z bazą danych jest poza ekranami.

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
│   ├── BetCard.tsx               # Karta zakładu
│   ├── Avatar.tsx                # Awatar użytkownika (inicjały lub zdjęcie)
│   ├── StatCard.tsx              # Karta statystyk (bilans, win rate)
│   ├── Badge.tsx                 # Badge statusu (aktywny, wygrany, przegrany)
│   ├── PlayerRow.tsx             # Wiersz gracza z kursem i stawką
│   ├── MatchRow.tsx              # Wiersz meczu w historii meczów
│   └── LoadingScreen.tsx         # Ekran ładowania
│
├── services/                     # Komunikacja z Supabase — TYLKO tutaj
│   ├── auth.service.ts           # Logowanie, rejestracja, wylogowanie
│   ├── bets.service.ts           # Tworzenie, pobieranie, aktualizacja zakładów
│   ├── results.service.ts        # Wpisywanie i potwierdzanie wyników
│   ├── settlements.service.ts    # Tworzenie i aktualizacja rozliczeń
│   ├── users.service.ts          # Pobieranie profili, szukanie po nicku
│   ├── sessions.service.ts       # Tworzenie i zarządzanie sesjami
│   └── notifications.service.ts  # Powiadomienia push
│
├── hooks/                        # Logika wielokrotnego użytku + stan
│   ├── useAuth.ts                # Stan zalogowanego użytkownika
│   ├── useBets.ts                # Pobieranie zakładów użytkownika
│   ├── useBetDetail.ts           # Szczegóły jednego zakładu (realtime)
│   ├── useSession.ts             # Dane sesji wielodyscyplinarnej
│   └── useFriends.ts             # Lista znajomych
│
├── utils/                        # Czyste funkcje bez efektów ubocznych
│   ├── odds.ts                   # Obliczanie kursów
│   ├── settlements.ts            # Obliczanie rozliczeń
│   ├── formats.ts                # Logika formatów (best_of, per_match, elimination)
│   ├── bracket.ts                # Generowanie drabinki turniejowej
│   └── date.ts                   # Formatowanie dat po polsku
│
├── types/                        # Typy TypeScript
│   ├── bet.types.ts
│   ├── user.types.ts
│   ├── session.types.ts
│   └── navigation.types.ts
│
├── constants/                    # Stałe wartości
│   ├── colors.ts                 # Paleta kolorów
│   ├── games.ts                  # Szablony gier z emoji
│   └── formats.ts                # Definicje formatów rozgrywki
│
└── lib/
    └── supabase.ts               # Tylko klient Supabase — nic więcej
```

---

## Warstwy — szczegółowy opis

### 1. app/ — Ekrany (warstwa prezentacji)
Ekrany są "głupie" — tylko wyświetlają dane i wywołują funkcje.

**Co wolno w ekranach:**
- Importować hooki z hooks/
- Importować komponenty z components/
- Importować stałe z constants/
- Nawigować między ekranami
- Wyświetlać stan lokalny UI (np. czy modal jest otwarty)

**Czego NIE wolno w ekranach:**
- Importować supabase bezpośrednio
- Pisać zapytań SQL / .from().select()
- Obliczać kursów ani rozliczeń
- Trzymać logiki biznesowej

**Przykład dobry:**
```typescript
// app/new-bet.tsx
const { createBet, loading } = useBets()

const handleSubmit = async () => {
  await createBet({ game, format, stakeMode, participants, stakes })
  navigation.navigate('Home')
}
```

**Przykład zły:**
```typescript
// app/new-bet.tsx — NIE RÓB TAK
const { data } = await supabase.from('bets').insert({ ... })
```

---

### 2. services/ — Komunikacja z bazą danych

Każdy serwis odpowiada za jedną tabelę lub domenę.
Serwisy zwracają dane lub rzucają błędy — nie zarządzają stanem UI.

**auth.service.ts**
```typescript
export const AuthService = {
  signIn: (email: string, password: string) => Promise<Session>
  signUp: (email: string, password: string) => Promise<Session>
  signOut: () => Promise<void>
  getSession: () => Promise<Session | null>
}
```

**bets.service.ts**
```typescript
export const BetsService = {
  createBet: (params: CreateBetParams) => Promise<Bet>
  getBet: (id: string) => Promise<BetWithParticipants>
  getUserBets: (userId: string) => Promise<Bet[]>
  updateBetStatus: (id: string, status: BetStatus) => Promise<void>
  addParticipant: (betId: string, userId: string, stake: number) => Promise<void>
}
```

**results.service.ts**
```typescript
export const ResultsService = {
  addResult: (betId: string, matchNumber: number, scores: Scores, winnerId: string) => Promise<void>
  confirmResult: (resultId: string, userId: string) => Promise<void>
  getResults: (betId: string) => Promise<BetResult[]>
}
```

**settlements.service.ts**
```typescript
export const SettlementsService = {
  createSettlements: (betId: string, winnerId: string) => Promise<void>
  markAsPaid: (settlementId: string) => Promise<void>
  getSettlements: (betId: string) => Promise<Settlement[]>
  getUserBalance: (userId: string) => Promise<number>
}
```

---

### 3. hooks/ — Stan i logika wielokrotnego użytku

Hooki łączą serwisy z ekranami. Zarządzają stanem ładowania i błędami.

**useAuth.ts**
```typescript
export const useAuth = () => {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email, password) => Promise<void>
  signOut: () => Promise<void>
}
```

**useBets.ts**
```typescript
export const useBets = () => {
  bets: Bet[]
  activeBets: Bet[]
  loading: boolean
  error: string | null
  createBet: (params) => Promise<void>
  refreshBets: () => Promise<void>
}
```

**useBetDetail.ts**
```typescript
export const useBetDetail = (betId: string) => {
  bet: BetWithParticipants | null
  results: BetResult[]
  settlements: Settlement[]
  loading: boolean
  addResult: (matchNumber, scores, winnerId) => Promise<void>
  confirmResult: (resultId) => Promise<void>
  markAsPaid: (settlementId) => Promise<void>
  // Realtime — automatyczne odświeżanie gdy zmienią się dane
}
```

---

### 4. utils/ — Czyste funkcje

Funkcje które nic nie pobierają i nic nie zapisują — tylko obliczają.
Można je testować bez Supabase, bez telefonu.

**odds.ts**
```typescript
// Oblicza kurs dla każdego gracza na podstawie proporcji stawek
export const calculateOdds = (stakes: Record<string, number>): Record<string, number> => {
  const total = Object.values(stakes).reduce((sum, s) => sum + s, 0)
  return Object.fromEntries(
    Object.entries(stakes).map(([userId, stake]) => [userId, total / stake])
  )
}

// Przykład:
// calculateOdds({ kuba: 20, marek: 10 }) → { kuba: 1.5, marek: 3.0 }
```

**settlements.ts**
```typescript
// Oblicza kto komu ile jest winien po zakończeniu zakładu
export const calculateSettlements = (
  participants: Participant[],
  winnerId: string,
  stakeMode: StakeMode
): Settlement[] => { ... }
```

**formats.ts**
```typescript
// Sprawdza czy seria Best of X jest zakończona
export const isBestOfComplete = (results: BetResult[], bestOfCount: number): string | null => {
  // zwraca id zwycięzcy lub null jeśli seria trwa
}

// Generuje kolejną rundę eliminacji
export const getNextRound = (results: BetResult[], participants: string[]): Pair[] => { ... }
```

**bracket.ts**
```typescript
// Losuje pary do drabinki (tryb AUTO)
export const generateBracket = (participants: string[]): Pair[][] => { ... }

// Generuje pary ręcznie wskazane przez organizatora (tryb RĘCZNY)
export const createManualPair = (player1: string, player2: string, round: number): Pair => { ... }
```

---

### 5. types/ — Typy TypeScript

**bet.types.ts**
```typescript
export type BetFormat = 'single' | 'per_match' | 'best_of' | 'round_robin' | 'elimination' | 'session'
export type StakeMode = 'equal' | 'custom' | 'prediction' | 'none'
export type BetStatus = 'pending' | 'active' | 'in_progress' | 'completed' | 'disputed'

export interface Bet {
  id: string
  creator_id: string
  game_template: string
  format: BetFormat
  stake_mode: StakeMode
  status: BetStatus
  best_of_count?: number
  stake_per_match?: number
  session_id?: string
  bracket_mode?: 'auto' | 'manual'
  notes?: string
  created_at: string
}

export interface BetParticipant {
  id: string
  bet_id: string
  user_id: string
  stake_amount: number
  odds: number
  role: 'creator' | 'participant'
  confirmed: boolean
}

export interface BetResult {
  id: string
  bet_id: string
  match_number: number
  round_number?: number
  winner_id: string
  scores: Record<string, number>
  confirmed: boolean
}

export interface Settlement {
  id: string
  bet_id: string
  debtor_id: string
  creditor_id: string
  amount: number
  paid: boolean
  paid_at?: string
}

export interface BetWithParticipants extends Bet {
  participants: BetParticipant[]
  results: BetResult[]
  settlements: Settlement[]
}
```

**user.types.ts**
```typescript
export interface UserProfile {
  id: string
  phone?: string
  nick: string
  avatar_url?: string
  created_at: string
}

export interface UserStats {
  totalBets: number
  wonBets: number
  lostBets: number
  winRate: number
  balance: number
}
```

---

### 6. constants/ — Stałe

**colors.ts**
```typescript
export const Colors = {
  background: '#0f1117',
  card: '#181c24',
  cardAlt: '#1e2330',
  accent: '#534AB7',
  accentLight: '#7F77DD',
  text: '#e8e6e0',
  textMuted: 'rgba(232,230,224,0.5)',
  green: '#1D9E75',
  red: '#E24B4A',
  amber: '#EF9F27',
  border: 'rgba(255,255,255,0.08)',
}
```

**games.ts**
```typescript
export const GAME_TEMPLATES = [
  { id: 'pilkarzyki', name: 'Piłkarzyki', emoji: '⚽' },
  { id: 'ping_pong', name: 'Ping pong', emoji: '🏓' },
  { id: 'dart', name: 'Dart', emoji: '🎯' },
  { id: 'koszykowka', name: 'Koszykówka 1v1', emoji: '🏀' },
  { id: 'szachy', name: 'Szachy', emoji: '♟️' },
  { id: 'poker', name: 'Poker', emoji: '🃏' },
  { id: 'gra_video', name: 'Gra video', emoji: '🎮' },
  { id: 'wlasna', name: 'Własna gra', emoji: '✏️' },
]
```

**formats.ts**
```typescript
export const BET_FORMATS = [
  {
    id: 'single',
    name: 'Jeden mecz',
    description: 'Jeden wynik rozstrzyga zakład',
    icon: '⚔️',
  },
  {
    id: 'per_match',
    name: 'Zakład za mecz',
    description: 'Każdy mecz to osobna stawka. Grasz ile chcesz.',
    icon: '📊',
  },
  {
    id: 'best_of',
    name: 'Best of X',
    description: 'Best of 3, 5 lub 7. Wygrywa kto pierwszy dobije.',
    icon: '🏆',
  },
  {
    id: 'round_robin',
    name: 'Round Robin',
    description: 'Każdy gra z każdym. Ranking po wszystkich meczach.',
    icon: '🔄',
  },
  {
    id: 'elimination',
    name: 'Eliminacje',
    description: 'Drabinka turniejowa. Przegrany odpada.',
    icon: '🥊',
  },
  {
    id: 'session',
    name: 'Sesja wielu gier',
    description: 'Kilka dyscyplin w jednym wieczorze.',
    icon: '🎪',
  },
]
```

---

## Reguły dla Cursora

1. Nigdy nie pisz supabase.from() w plikach app/ ani components/
2. Każdy serwis eksportuje obiekt z nazwanymi funkcjami (nie default export)
3. Każdy hook zwraca loading i error oprócz danych
4. Wszystkie typy są w types/ — nie twórz typów inline w ekranach
5. Kolory zawsze z Colors z constants/colors.ts — nigdy hardcodowane stringi
6. Nazwy plików: ekrany kebab-case (new-bet.tsx), serwisy camelCase (bets.service.ts), typy PascalCase (Bet, UserProfile)
7. Każda funkcja w utils/ ma komentarz z przykładem użycia
8. Hooki zaczynają się od "use" (useAuth, useBets)
9. Serwisy kończą się ".service" (bets.service.ts)