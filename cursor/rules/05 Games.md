# BetMates — Dyscypliny i formaty

## GAME_TEMPLATES (constants/games.ts)

```typescript
export type ResultType = 'score' | 'legs' | 'sets' | 'winner_only' | 'chips'
export type WinCondition = 'higher_score' | 'most_legs' | 'most_sets' | 'winner_only' | 'chip_count'

export interface GameTemplate {
  id: string
  name: string
  emoji: string
  category: 'sport' | 'planszowe' | 'video' | 'inne'
  resultType: ResultType
  defaultFormat: BetFormat
  defaultBestOf?: number
  availableFormats: BetFormat[]
  scoringLabel: string | null
  winCondition: WinCondition
  supportsTeams: boolean
  supportsRematch: boolean       // czy remis jest możliwy
  customName?: boolean           // użytkownik wpisuje nazwę (własna gra)
  pokerModes?: PokerMode[]
  supportsRebuy?: boolean
  defaultStack?: number
  defaultRebuyStack?: number
}

export const GAME_TEMPLATES: GameTemplate[] = [
  // SPORT
  {
    id: 'pilkarzyki', name: 'Piłkarzyki', emoji: '⚽', category: 'sport',
    resultType: 'score', defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'per_match', 'round_robin', 'elimination', 'session'],
    scoringLabel: 'Bramki', winCondition: 'higher_score',
    supportsTeams: true, supportsRematch: false,
  },
  {
    id: 'ping_pong', name: 'Ping pong', emoji: '🏓', category: 'sport',
    resultType: 'score', defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'per_match', 'round_robin', 'elimination', 'session'],
    scoringLabel: 'Punkty', winCondition: 'higher_score',
    supportsTeams: false, supportsRematch: false,
  },
  {
    id: 'dart', name: 'Dart', emoji: '🎯', category: 'sport',
    resultType: 'legs', defaultFormat: 'best_of', defaultBestOf: 3,
    availableFormats: ['single', 'best_of', 'per_match', 'elimination', 'session'],
    scoringLabel: 'Legi', winCondition: 'most_legs',
    supportsTeams: false, supportsRematch: false,
  },
  {
    id: 'koszykowka', name: 'Koszykówka 1v1', emoji: '🏀', category: 'sport',
    resultType: 'score', defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'per_match', 'session'],
    scoringLabel: 'Punkty', winCondition: 'higher_score',
    supportsTeams: false, supportsRematch: false,
  },
  {
    id: 'tenis', name: 'Tenis', emoji: '🎾', category: 'sport',
    resultType: 'sets', defaultFormat: 'best_of', defaultBestOf: 3,
    availableFormats: ['single', 'best_of', 'session'],
    scoringLabel: 'Sety', winCondition: 'most_sets',
    supportsTeams: false, supportsRematch: false,
  },
  {
    id: 'badminton', name: 'Badminton', emoji: '🏸', category: 'sport',
    resultType: 'score', defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'per_match', 'session'],
    scoringLabel: 'Punkty', winCondition: 'higher_score',
    supportsTeams: false, supportsRematch: false,
  },
  {
    id: 'bilard', name: 'Bilard', emoji: '🎱', category: 'sport',
    resultType: 'winner_only', defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'per_match', 'round_robin', 'elimination', 'session'],
    scoringLabel: null, winCondition: 'winner_only',
    supportsTeams: false, supportsRematch: false,
  },
  {
    id: 'bowling', name: 'Bowling', emoji: '🎳', category: 'sport',
    resultType: 'score', defaultFormat: 'single',
    availableFormats: ['single', 'round_robin', 'elimination', 'session'],
    scoringLabel: 'Punkty', winCondition: 'higher_score',
    supportsTeams: false, supportsRematch: false,
  },
  // PLANSZOWE
  {
    id: 'szachy', name: 'Szachy', emoji: '♟️', category: 'planszowe',
    resultType: 'winner_only', defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'session'],
    scoringLabel: null, winCondition: 'winner_only',
    supportsTeams: false, supportsRematch: true,  // remis możliwy
  },
  {
    id: 'poker', name: 'Poker', emoji: '🃏', category: 'planszowe',
    resultType: 'chips', defaultFormat: 'single',
    availableFormats: ['single', 'session'],
    scoringLabel: null, winCondition: 'chip_count',
    supportsTeams: false, supportsRematch: false,
    pokerModes: ['winner_takes_all', 'chip_count'],
    supportsRebuy: true, defaultStack: 3000, defaultRebuyStack: 1500,
  },
  {
    id: 'uno', name: 'UNO', emoji: '🃏', category: 'planszowe',
    resultType: 'winner_only', defaultFormat: 'single',
    availableFormats: ['single', 'per_match', 'session'],
    scoringLabel: null, winCondition: 'winner_only',
    supportsTeams: false, supportsRematch: false,
  },
  // GRY VIDEO
  {
    id: 'clash_royale', name: 'Clash Royale', emoji: '🏰', category: 'video',
    resultType: 'score', defaultFormat: 'per_match',
    availableFormats: ['single', 'best_of', 'per_match', 'round_robin', 'elimination', 'session'],
    scoringLabel: 'Korony', winCondition: 'higher_score',
    supportsTeams: false, supportsRematch: false,
  },
  {
    id: 'fifa', name: 'FIFA / EA FC', emoji: '⚽🎮', category: 'video',
    resultType: 'score', defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'per_match', 'round_robin', 'elimination', 'session'],
    scoringLabel: 'Bramki', winCondition: 'higher_score',
    supportsTeams: false, supportsRematch: true,
  },
  {
    id: 'bijatyki', name: 'Bijatyki (Tekken/SF)', emoji: '🥊', category: 'video',
    resultType: 'winner_only', defaultFormat: 'best_of', defaultBestOf: 3,
    availableFormats: ['single', 'best_of', 'per_match', 'elimination', 'session'],
    scoringLabel: null, winCondition: 'winner_only',
    supportsTeams: false, supportsRematch: false,
  },
  {
    id: 'rocket_league', name: 'Rocket League', emoji: '🚗', category: 'video',
    resultType: 'score', defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'per_match', 'round_robin', 'elimination', 'session'],
    scoringLabel: 'Bramki', winCondition: 'higher_score',
    supportsTeams: true, supportsRematch: false,
  },
  {
    id: 'nba2k', name: 'NBA 2K', emoji: '🏀🎮', category: 'video',
    resultType: 'score', defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'per_match', 'session'],
    scoringLabel: 'Punkty', winCondition: 'higher_score',
    supportsTeams: false, supportsRematch: false,
  },
  // INNE
  {
    id: 'wlasna', name: 'Własna gra', emoji: '✏️', category: 'inne',
    resultType: 'winner_only', defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'per_match', 'session'],
    scoringLabel: null, winCondition: 'winner_only',
    supportsTeams: true, supportsRematch: false, customName: true,
  },
]
```

---

## Komponenty wpisywania wyniku

| Komponent | ResultType | Dyscypliny |
|---|---|---|
| ScoreInput | score | Piłkarzyki, Ping pong, Koszykówka, Tenis, Badminton, Bowling, FIFA, Clash Royale, Rocket League, NBA 2K |
| LegsInput | legs | Dart |
| WinnerPicker | winner_only | Bilard, Szachy, Bijatyki, UNO, Własna gra |
| ChipCountInput | chips | Poker (tryb chip_count) |

Ekran `enter-result.tsx` renderuje odpowiedni komponent automatycznie na podstawie `game.resultType`.

---

## Tabela dyscypliny × formaty

| Dyscyplina | Jeden mecz | Best of X | Za mecz | Round Robin | Eliminacje | Sesja |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Piłkarzyki ⚽ | ✅ def | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ping pong 🏓 | ✅ def | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dart 🎯 | ✅ | ✅ def | ✅ | ❌ | ✅ | ✅ |
| Koszykówka 🏀 | ✅ def | ✅ | ✅ | ❌ | ❌ | ✅ |
| Tenis 🎾 | ✅ | ✅ def | ❌ | ❌ | ❌ | ✅ |
| Badminton 🏸 | ✅ def | ✅ | ✅ | ❌ | ❌ | ✅ |
| Bilard 🎱 | ✅ def | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bowling 🎳 | ✅ def | ❌ | ❌ | ✅ | ✅ | ✅ |
| Szachy ♟️ | ✅ def | ✅ | ❌ | ❌ | ❌ | ✅ |
| Poker 🃏 | ✅ def | ❌ | ❌ | ❌ | ❌ | ✅ |
| UNO 🃏 | ✅ def | ❌ | ✅ | ❌ | ❌ | ✅ |
| Clash Royale 🏰 | ✅ | ✅ | ✅ def | ✅ | ✅ | ✅ |
| FIFA ⚽🎮 | ✅ def | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bijatyki 🥊 | ✅ | ✅ def | ✅ | ❌ | ✅ | ✅ |
| Rocket League 🚗 | ✅ def | ✅ | ✅ | ✅ | ✅ | ✅ |
| NBA 2K 🏀🎮 | ✅ def | ✅ | ✅ | ❌ | ❌ | ✅ |
| Własna gra ✏️ | ✅ def | ✅ | ✅ | ❌ | ❌ | ✅ |

`def` = domyślny format dla tej dyscypliny