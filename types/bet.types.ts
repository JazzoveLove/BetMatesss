export type BetFormat =
  | 'single'
  | 'per_match'
  | 'best_of'
  | 'round_robin'
  | 'elimination'
  | 'session'
  | 'series'
  | 'team'
export type StakeMode = 'equal' | 'custom' | 'prediction' | 'pick' | 'none'
export type BetStatus =
  | 'pending'
  | 'active'
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'completed'
  | 'disputed'

export type NewBetParticipant = {
  id: string
  nick: string
  customStake: string
}

export type BetParticipant = {
  id: string
  nick: string
  stakeAmount: number
  odds: number
  role: string
  confirmed: boolean
}

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
  notes?: string | null
  created_at: string
}

export interface BetResult {
  id: string
  bet_id: string
  match_number: number
  round_number?: number
  winner_id: string
  scores: Record<string, number | string>
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
  gameTemplate: string
  format: BetFormat
  stakeMode: StakeMode
  status: BetStatus
  notes: string | null
  createdAt: string
  participants: BetParticipant[]
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
  format: BetFormat | string
  stakeMode: StakeMode
  participants: NewBetParticipant[]
  globalStake: number
}

/** Etykieta badge na liście historii (SPEC + spór / remis bez kasy) */
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
