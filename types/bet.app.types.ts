import type { BetResultRow } from './bet.row.types'

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
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'completed'
  | 'disputed'
  | 'rejected'
export type ResultType = 'score' | 'legs' | 'sets' | 'winner_only' | 'chips'
export type PokerMode = 'winner_takes_all' | 'chip_count'

export type NewBetParticipant = {
  id: string
  nick: string
  customStake: number
}
export type ParticipantRole = 'creator' | 'participant'
export type BetParticipant = {
  id: string
  nick: string
  stakeAmount: number
  odds: number
  role: ParticipantRole
  confirmed: boolean
}

export type BetSummary = {
  id: string
  creatorId: string
  gameTemplate: string
  format: BetFormat
  stakeMode: StakeMode
  status: BetStatus
  notes: string | null
  createdAt: string
  stakePerMatch?: number
  rivalryId?: string
  sessionId?: string
  bracketMode?: 'auto' | 'manual'
  pokerMode?: PokerMode
  pokerStack?: number
  pokerRebuyStack?: number
  bestOfCount?: number
  rejectedAt?: string
}

export type Settlement = {
  id: string
  debtorId: string
  debtorNick: string
  creditorId: string
  creditorNick: string
  amount: number
  paid: boolean
  paidAt?: string
  paymentStatus?: 'unpaid' | 'pending_confirmation' | 'paid' | 'disputed'
  confirmedBy?: string
  confirmedAt?: string
}

export type BetDetail = {
  id: string
  creatorId: string
  gameTemplate: string
  format: BetFormat
  stakeMode: StakeMode
  status: BetStatus
  notes: string | null
  createdAt: string
  stakePerMatch?: number
  participants: BetParticipant[]
  results: BetResultRow[]
}

export type PendingResult = {
  id: string
  winnerId: string
  score: string
  recordedBy: string
  confirmed: boolean
}

export interface CreateBetParams {
  creatorId: string
  gameTemplate: string
  format: BetFormat
  stakeMode: StakeMode
  participants: NewBetParticipant[]
  globalStake: number
  bestOfCount?: number
  stakeAmount?: number
  stakePerMatch?: number
  customStakes?: Record<string, number>
  pokerMode?: PokerMode
  pokerStack?: number
  pokerRebuyStack?: number
  participantIds?: string[]
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

export type DisciplineStatRow = {
  gameTemplate: string
  wins: number
  losses: number
  winPct: number
}

export type FriendRankRow = {
  id: string
  nick: string
  balance: number
}

export type DashboardStats = {
  balance: number
  totalBets: number
  winRate: number
}

export type ProfileScreenData = {
  nick: string
  createdAt: string | null
  stats: DashboardStats
  disciplines: DisciplineStatRow[]
  friendsRank: FriendRankRow[]
}
