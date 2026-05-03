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
/** Surowa odpowiedź z Supabase — używaj tylko w services/ */
export interface BetRow {
  id: string
  creator_id: string
  rivalry_id?: string
  game_template: string
  format: BetFormat
  stake_mode: StakeMode
  status: BetStatus
  best_of_count?: number
  stake_per_match?: number
  session_id?: string
  bracket_mode?: 'auto' | 'manual'
  poker_mode?: PokerMode
  poker_stack?: number
  poker_rebuy_stack?: number
  notes?: string | null
  created_at: string
}
/** Skrót zakładu na listy w hooks/UI — bez pól DB; mapuj z BetRow w services/. */
export type BetSummary = {
  id: string
  gameTemplate: string
  status: BetStatus
}
/** Surowa odpowiedź z Supabase — używaj tylko w services/ */
export interface BetResultRow {
  id: string
  bet_id: string
  match_number: number
  round_number?: number
  winner_id: string
  scores: {score: string}
  chips?: Record<string, number>
  confirmed: boolean
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
  sendReminder: (settlement: Settlement) => Promise<void>
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
}

export type DashboardStats = {
  balance: number
  totalBets: number
  winRate: number
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

export type HistoryBadgeLabel = 'aktywny' | 'wygrany' | 'przegrany' | 'oczekuje' | 'spór' | 'zakończony'

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

export type ProfileScreenData = {
  nick: string
  createdAt: string | null
  stats: DashboardStats
  disciplines: DisciplineStatRow[]
  friendsRank: FriendRankRow[]
}
