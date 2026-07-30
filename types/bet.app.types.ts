import type { BetResultRow } from './bet.row.types'
import type { BetFormat, StakeMode, PokerMode } from './bet.creation.types'

export type BetStatus =
  | 'pending'
  | 'active'
  | 'awaiting_confirmation'
  | 'completed'
  | 'disputed'
  | 'rejected'
export type ResultType = 'score' | 'legs' | 'sets' | 'winner_only' | 'chips'

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
