import type { BetResultRow } from './bet.row.types'
import type { BetFormat, StakeMode } from './bet.creation.types'

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
  createdAt: string
  stakePerMatch?: number
  rejectedAt?: string
}

export type Settlement = {
  id: string
  debtorId: string
  debtorNick: string
  creditorId: string
  creditorNick: string
  amount: number
}

export type BetDetail = {
  id: string
  creatorId: string
  gameTemplate: string
  format: BetFormat
  stakeMode: StakeMode
  status: BetStatus
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
