import type { BetDetail, BetStatus, PendingResult, Settlement } from './bet.app.types'

export type FormatViewProps = {
  bet: BetDetail
  currentUserId: string | null
  settlements: Settlement[]
  resolving: boolean
  confirming: boolean
  disputing: boolean
  pendingResult: PendingResult | null
  submitResult: (winnerId: string, score?: string) => Promise<boolean>
  submitPerMatchResult: (winnerId: string, score: string, requireScore: boolean) => Promise<boolean>
  completeMatchSession: () => Promise<boolean>
  confirmResult: () => Promise<void>
  disputeResult: () => Promise<void>
  acceptBet: () => Promise<boolean>
  rejectBet: () => Promise<boolean>
  accepting: boolean
  rejecting: boolean
  completingSession: boolean
  openResultModal: () => void
  openPerMatchResultModal: () => void
}

export type ActiveBetItem = {
  id: string
  gameTemplate: string
  status: BetStatus
  stakeAmount: number
  odds: number
  opponentNick: string
}

export type RecentResult = {
  id: string
  gameTemplate: string
  opponentNick: string
  profit: number
  won: boolean
}

export type HistoryBadgeLabel = 'aktywny' | 'wygrany' | 'przegrany' | 'oczekuje' | 'spór' | 'zakończony' | 'odrzucony'

export type HistoryListItem = {
  id: string
  gameTemplate: string
  createdAt: string
  opponentNick: string
  badge: HistoryBadgeLabel
  amountLabel: string
  profit: number
}

