import type { Tables } from '@/shared/types/database_types'

export type SettlementRow = Pick<Tables<'settlements'>, 'bet_id' | 'debtor_id' | 'creditor_id' | 'amount'>

export type SettlementListDbRow = Pick<Tables<'settlements'>, 'id' | 'amount' | 'debtor_id' | 'creditor_id'>

export type BetParticipantStakeRow = Pick<Tables<'bet_participants'>, 'user_id' | 'stake_amount'>
