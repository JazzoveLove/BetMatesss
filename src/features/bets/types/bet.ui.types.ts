import type { BetStatus } from './bet.app.types'

export type ActiveBetItem = {
  id: string
  gameTemplate: string
  status: BetStatus
  stakeAmount: number
  odds: number
  opponentNick: string
  opponentId: string
}

export type RecentResult = {
  id: string
  gameTemplate: string
  opponentNick: string
  opponentId: string
  profit: number
  won: boolean
}

export type HistoryBadgeLabel = 'aktywny' | 'wygrany' | 'przegrany' | 'oczekuje' | 'spór' | 'zakończony' | 'odrzucony' | 'anulowany'

export type HistoryListItem = {
  id: string
  gameTemplate: string
  createdAt: string
  opponentNick: string
  opponentId: string
  badge: HistoryBadgeLabel
  amountLabel: string
  profit: number
}

