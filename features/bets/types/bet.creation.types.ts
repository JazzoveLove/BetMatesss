export type BetFormat =
  | 'single'
  | 'best_of'
  | 'per_match'
  | 'round_robin'
  | 'elimination'
  | 'session'
export type StakeMode = 'none' | 'equal' | 'custom'
export type PokerMode = 'winner_takes_all' | 'chip_count'

export type NewBetParticipant = {
  id: string
  nick: string
  customStake: number
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
