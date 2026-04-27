# BetMates — Baza danych

## Tabele

### users
```sql
id          uuid primary key
nick        text unique (max 20 znaków)
avatar_url  text nullable
created_at  timestamptz
```

### friendships
```sql
id          uuid primary key
user_a      uuid references users
user_b      uuid references users
status      text ('pending' | 'accepted')
created_at  timestamptz
```

### rivalries
```sql
id              uuid primary key
game_template   text (id dyscypliny np. 'pilkarzyki')
participant_ids uuid[] (posortowane alfabetycznie)
created_at      timestamptz
```

Rywalizacja = konkretna kombinacja graczy + dyscyplina.
Tworzy się automatycznie przy pierwszym meczu i rośnie w czasie.

Jak identyfikować:
1. Posortuj UUID uczestników alfabetycznie → klucz
2. Sprawdź czy istnieje rivalry z tym game_template i participant_ids
3. Jeśli tak → przypisz rivalry_id do nowego zakładu
4. Jeśli nie → utwórz nową, potem przypisz

### bets
```sql
id                  uuid primary key
creator_id          uuid references users
rivalry_id          uuid references rivalries nullable
game_template       text (id dyscypliny)
format              text ('single'|'best_of'|'per_match'|'round_robin'|'elimination'|'session')
stake_mode          text ('none'|'equal'|'custom') default 'none'
status              text ('pending'|'active'|'awaiting_confirmation'|'completed'|'disputed')
best_of_count       int nullable (3/5/7 — tylko dla best_of)
stake_per_match     numeric nullable (kwota za mecz — tylko dla per_match)
stake_amount        numeric nullable (kwota łączna — dla equal)
session_id          uuid nullable (tylko dla dyscyplin w sesji)
bracket_mode        text nullable ('auto'|'manual' — tylko dla elimination)
poker_mode          text nullable ('winner_takes_all'|'chip_count')
poker_stack         int nullable (stack startowy np. 3000)
poker_rebuy_stack   int nullable (stack dokupa np. 1500)
notes               text nullable
created_at          timestamptz
```

### bet_participants
```sql
id            uuid primary key
bet_id        uuid references bets
user_id       uuid references users
stake_amount  numeric default 0
rebuy_count   int default 0 (ile razy dokupił — poker)
odds          numeric default 1
role          text ('creator'|'participant')
confirmed     boolean default false
```

### bet_results
```sql
id            uuid primary key
bet_id        uuid references bets
match_number  int (numer meczu w serii, zaczyna od 1)
round_number  int nullable (dla eliminacji i round robin)
winner_id     uuid references users nullable
scores        jsonb (np. {"user_id_1": 5, "user_id_2": 3})
chips         jsonb nullable (żetony końcowe — poker chip_count)
confirmed     boolean default false
confirmed_by  uuid nullable references users
recorded_by   uuid references users
created_at    timestamptz
```

### settlements
```sql
id           uuid primary key
bet_id       uuid references bets
debtor_id    uuid references users
creditor_id  uuid references users
amount       numeric
paid         boolean default false
paid_at      timestamptz nullable
```

### sessions
```sql
id              uuid primary key
creator_id      uuid references users
title           text
date            date
participants    jsonb (array of user_ids)
created_at      timestamptz
```

### messages
```sql
id          uuid primary key
bet_id      uuid references bets
user_id     uuid references users
content     text
created_at  timestamptz
```

### notifications
```sql
id          uuid primary key
user_id     uuid references users
type        text
payload     jsonb
read        boolean default false
created_at  timestamptz
```

---

## Typy TypeScript (types/bet.types.ts)

```typescript
export type BetFormat =
  | 'single'
  | 'best_of'
  | 'per_match'
  | 'round_robin'
  | 'elimination'
  | 'session'

export type StakeMode = 'none' | 'equal' | 'custom'

export type BetStatus =
  | 'pending'
  | 'active'
  | 'awaiting_confirmation'
  | 'completed'
  | 'disputed'

export type PokerMode = 'winner_takes_all' | 'chip_count'

export type ResultType = 'score' | 'legs' | 'sets' | 'winner_only' | 'chips'

export interface Bet {
  id: string
  creator_id: string
  rivalry_id?: string
  game_template: string
  format: BetFormat
  stake_mode: StakeMode
  status: BetStatus
  best_of_count?: number
  stake_per_match?: number
  stake_amount?: number
  session_id?: string
  bracket_mode?: 'auto' | 'manual'
  poker_mode?: PokerMode
  poker_stack?: number
  poker_rebuy_stack?: number
  notes?: string
  created_at: string
}

export interface BetParticipant {
  id: string
  bet_id: string
  user_id: string
  stake_amount: number
  rebuy_count: number
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
  chips?: Record<string, number>
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

```typescript
// types/user.types.ts

export interface UserProfile {
  id: string
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