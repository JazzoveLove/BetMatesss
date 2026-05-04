/** Typy dla modułu rozliczeń */

export type SettlementRow = {
  bet_id: string
  debtor_id: string
  creditor_id: string
  amount: number
  paid: false
}

export type SettlementListDbRow = {
  id: string
  amount: number | string
  paid: boolean
  paid_at: string | null
  debtor_id: string
  creditor_id: string
}

export type BetResultRaw = {
  id: string
  match_number: number
  winner_id: string
  scores: { score: string } | null
  confirmed: boolean
}

export type BetParticipantRowPerMatch = {
  user_id: string
  stake_amount: number | string
  odds: number | string
  role: string
  confirmed: boolean
}

export type BetParticipantStakeRow = {
  user_id: string
  stake_amount: number | string
}
