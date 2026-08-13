export type BetFormat =
  | 'single'
  | 'best_of'
  | 'per_match'
  | 'round_robin'
  | 'elimination'
  | 'session'
export type StakeMode = 'none' | 'equal' | 'custom'

export type NewBetParticipant = {
  id: string
  nick: string
  customStake: number
}

export interface CreateBetParams {
  creatorId: string
  gameTemplate: string
  format: 'single'
  stakeMode: StakeMode
  participants: NewBetParticipant[]
  globalStake: number
  stakeAmount?: number
  customStakes?: Record<string, number>
  participantIds?: string[]
}
