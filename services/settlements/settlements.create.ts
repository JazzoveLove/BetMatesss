/** Główna funkcja tworzenia rozliczeń */

import { supabase } from '../../lib/supabase'
import type { BetResultRow, StakeMode } from '../../types/bet.types'
import { log } from '../../utils/logger'
import { parseStakeAmount } from '../../utils/odds'
import { createSettlementsFromWinner } from './settlements.create.winner'
import { createSettlementsPerMatch } from './settlements.create.perMatch'
import type { BetResultRaw, BetParticipantRowPerMatch, SettlementRow } from './settlements.types'

export function buildSettlementRows(
  betId: string,
  participants: { user_id: string; stake_amount: number | string }[],
  winnerId: string,
): SettlementRow[] {
  return participants
    .filter(p => p.user_id !== winnerId)
    .map(p => {
      const amount = parseStakeAmount(p.stake_amount)
      if (amount <= 0) return null
      return { bet_id: betId, debtor_id: p.user_id, creditor_id: winnerId, amount, paid: false as const }
    })
    .filter((row): row is SettlementRow => row !== null)
}

/**
 * Wywołana po potwierdzeniu wyniku przez gracza B.
 * Pobiera uczestników i zwycięzcę, oblicza długi, zapisuje do settlements.
 */
export async function createSettlements(betId: string): Promise<{ error?: string }> {
  log('[createSettlements] step 1 start', { betId })

  const { count, error: countErr } = await supabase
    .from('settlements')
    .select('id', { count: 'exact', head: true })
    .eq('bet_id', betId)

  log('[createSettlements] step 2 existing settlements count', { count, countErr })

  if (countErr) {
    log('[createSettlements] count error', countErr)
    return { error: countErr.message }
  }
  if (count !== null && count > 0) {
    log('[createSettlements] step 2b settlements already exist — idempotent skip')
    return {}
  }

  log('[createSettlements] step 3 fetch bet stake_mode')
  const { data: bet, error: betErr } = await supabase
    .from('bets')
    .select('id, stake_mode, format, stake_per_match')
    .eq('id', betId)
    .maybeSingle()

  log('[createSettlements] step 3 bet row', { bet, betErr })

  if (betErr || !bet) {
    log('[createSettlements] bet not found', { betErr })
    return { error: betErr?.message ?? 'Nie znaleziono zakładu.' }
  }

  let stakeMode = (bet as { stake_mode: StakeMode }).stake_mode
  const betFormat = (bet as { format?: string }).format
  const stakePerMatch = Number((bet as { stake_per_match?: number | string }).stake_per_match ?? 0)
  log('[createSettlements] step 4 stake_mode', stakeMode)

  if (betFormat === 'per_match') {
    if (!Number.isFinite(stakePerMatch) || stakePerMatch <= 0) {
      log('[createSettlements] per_match: brak stawki za mecz — brak rozliczeń')
      return {}
    }

    const { data: participants, error: partErr } = await supabase
      .from('bet_participants')
      .select('user_id, stake_amount, odds, role, confirmed')
      .eq('bet_id', betId)

    if (partErr) return { error: partErr.message }

    const partRows = (participants ?? []) as BetParticipantRowPerMatch[]

    const { data: resultRows, error: resErr } = await supabase
      .from('bet_results')
      .select('id, match_number, winner_id, scores, confirmed')
      .eq('bet_id', betId)
      .order('match_number', { ascending: true })

    if (resErr) return { error: resErr.message }

    const results: BetResultRow[] = ((resultRows ?? []) as BetResultRaw[]).map(r => ({
      id: r.id,
      bet_id: betId,
      match_number: r.match_number,
      winner_id: r.winner_id,
      scores: { score: String(r.scores?.score ?? '') },
      confirmed: !!r.confirmed,
    }))

    return createSettlementsPerMatch(betId, stakePerMatch, partRows, results)
  }

  if (stakeMode === 'none') {
    // Last-line-of-defence: if any participant has a stake_amount > 0, the bet was meant to have money on it
    const { data: checkPart } = await supabase
      .from('bet_participants')
      .select('stake_amount')
      .eq('bet_id', betId)
      .gt('stake_amount', 0)
      .limit(1)
    if (checkPart && checkPart.length > 0) {
      log('[createSettlements] step 4b stake_mode=none but participants have stake_amount>0 — treating as equal')
      stakeMode = 'equal'
    } else {
      log('[createSettlements] step 4b stake_mode=none — no settlement rows')
      return {}
    }
  }

  log('[createSettlements] step 5 fetch bet_participants (user_id, stake_amount)')
  const { data: participants, error: partErr } = await supabase
    .from('bet_participants')
    .select('user_id, stake_amount')
    .eq('bet_id', betId)

  log('[createSettlements] step 5 participants', { participants, partErr })

  if (partErr) {
    log('[createSettlements] participants error', partErr)
    return { error: partErr.message }
  }

  const partRows = (participants ?? []) as { user_id: string; stake_amount: number | string }[]
  if (partRows.length === 0) {
    log('[createSettlements] step 5b no participants')
    return {}
  }

  return createSettlementsFromWinner(betId, partRows)
}
