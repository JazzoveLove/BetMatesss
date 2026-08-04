import type { BetDetail, BetStatus, PendingResult, Settlement } from './bet.app.types'
import type { StakeMode } from './bet.creation.types'

export type FormatViewProps = {
  bet: BetDetail
  currentUserId: string | null
  settlements: Settlement[]
  resolving: boolean
  confirming: boolean
  disputing: boolean
  markingPaid: string | null
  reminding: string | null
  pendingResult: PendingResult | null
  submitResult: (winnerId: string, score?: string) => Promise<boolean>
  submitPerMatchResult: (winnerId: string, score: string, requireScore: boolean) => Promise<boolean>
  completeMatchSession: () => Promise<boolean>
  confirmResult: () => Promise<void>
  disputeResult: () => Promise<void>
  markPaid: (settlementId: string, debtorId: string) => Promise<void>
  confirmPayment: (settlementId: string, creditorId: string) => Promise<void>
  rejectPayment: (settlementId: string, creditorId: string) => Promise<void>
  sendReminder: (settlement: Settlement) => Promise<void>
  acceptBet: () => Promise<boolean>
  rejectBet: () => Promise<boolean>
  accepting: boolean
  rejecting: boolean
  completingSession: boolean
  openResultModal: () => void
  openPerMatchResultModal: () => void
}
// czy to nie jest god table 

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

export type BetInvitePreview = {
  betId: string
  inviteCode: string
  title: string
  gameTemplate: string
  stakeMode: StakeMode
  status: BetStatus
  creatorId: string
  stakeAmount: number
  alreadyParticipant: boolean
  alreadyConfirmed: boolean
}
