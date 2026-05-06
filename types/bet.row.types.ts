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
    | 'in_progress'
    | 'awaiting_confirmation'
    | 'completed'
    | 'disputed'
    | 'rejected'
  rejected_at?: string | null
  best_of_count?: number
  stake_per_match?: number
  session_id?: string
  bracket_mode?: 'auto' | 'manual'
  poker_mode?: 'winner_takes_all' | 'chip_count'
  poker_stack?: number
  poker_rebuy_stack?: number
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
