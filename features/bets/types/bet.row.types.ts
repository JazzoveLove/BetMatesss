export interface BetRow {
  id: string
  creator_id: string
  rivalry_id?: string
  game_template: string
  format:
    | 'single'
    | 'best_of'
    | 'per_match'
    | 'round_robin'
    | 'elimination'
    | 'session'
  stake_mode: 'none' | 'equal' | 'custom'
  status:
    | 'pending'
    | 'active'
    | 'awaiting_confirmation'
    | 'completed'
    | 'disputed'
    | 'rejected'
  rejected_at?: string | null
  stake_per_match?: number
  notes?: string | null
  created_at: string
}

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

export interface ParticipantRow {
  bet_id: string
  user_id: string
  stake_amount: number
  odds: number
  role: 'creator' | 'participant'
  confirmed: boolean
}
