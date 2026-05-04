/** Tworzenie rozliczeń dla formatu per_match */

import { supabase } from '../../lib/supabase'
import type { BetParticipant, BetResultRow, ParticipantRole } from '../../types/bet.types'
import { calculatePerMatchBalance } from '../../utils/formats'
import { log } from '../../utils/logger'
import { parseStakeAmount } from '../../utils/odds'
import { settlementDraftsFromPairBalances } from '../../utils/settlements'
import type { BetParticipantRowPerMatch } from './settlements.types'

export async function createSettlementsPerMatch(
  betId: string,
  stakePerMatch: number,
  participants: BetParticipantRowPerMatch[],
  results: BetResultRow[],
): Promise<{ error?: string }> {
  const participantsForCalc: BetParticipant[] = participants.map(p => ({
    id: p.user_id,
    nick: '',
    stakeAmount: parseStakeAmount(p.stake_amount),
    odds: Number(p.odds) || 0,
    role: p.role as ParticipantRole,
    confirmed: p.confirmed,
  }))

  const balance = calculatePerMatchBalance(results, stakePerMatch, participantsForCalc)
  const ids = participants.map(p => p.user_id)
  const drafts = settlementDraftsFromPairBalances(balance, ids)
  log('[createSettlements] per_match drafts', drafts)

  if (drafts.length === 0) {
    log('[createSettlements] per_match: bilans zerowy — brak rozliczeń')
    return {}
  }

  const settlementRows = drafts.map(d => ({
    bet_id: betId,
    debtor_id: d.debtorId,
    creditor_id: d.creditorId,
    amount: d.amount,
    paid: false,
  }))

  const { error: insErr } = await supabase.from('settlements').insert(settlementRows)
  if (insErr) return { error: insErr.message }
  log('[createSettlements] per_match — utworzono', settlementRows.length, 'rozliczenie')
  return {}
}
