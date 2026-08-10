
import { supabase } from '@/shared/lib/supabase'
import type { BetResultRow, StakeMode } from '@/features/bets/types/bet.types'
import { log } from '@/shared/utils/logger'
import { parseStakeAmount } from '@/features/bets/utils/odds'
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
      const amount = Math.round(parseStakeAmount(p.stake_amount))
      if (amount <= 0) return null
      return { bet_id: betId, debtor_id: p.user_id, creditor_id: winnerId, amount }
    })
    .filter((row): row is SettlementRow => row !== null)
}

export async function createSettlements(betId: string): Promise<{ error?: string }> {
  const { count, error: countErr } = await supabase
    .from('settlements')
    .select('id', { count: 'exact', head: true })
    .eq('bet_id', betId)

  if (countErr) {
    return { error: countErr.message }
  }
  if (count !== null && count > 0) {
    return {}
  }

  const { data: bet, error: betErr } = await supabase
    .from('bets')
    .select('id, stake_mode, format, stake_per_match')
    .eq('id', betId)
    .maybeSingle()

  if (betErr || !bet) {
    return { error: betErr?.message ?? 'Nie znaleziono zakładu.' }
  }

  let stakeMode = (bet as { stake_mode: StakeMode }).stake_mode
  const betFormat = (bet as { format?: string }).format
  const stakePerMatch = Number((bet as { stake_per_match?: number | string }).stake_per_match ?? 0)

  if (betFormat === 'per_match') {
    if (!Number.isFinite(stakePerMatch) || stakePerMatch <= 0) {
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
    const { data: checkPart } = await supabase
      .from('bet_participants')
      .select('stake_amount')
      .eq('bet_id', betId)
      .gt('stake_amount', 0)
      .limit(1)
    if (checkPart && checkPart.length > 0) {
      log('[createSettlements] stake_mode=none but participants have stake_amount>0 — treating as equal')
      stakeMode = 'equal'
    } else {
      return {}
    }
  }

  const { data: participants, error: partErr } = await supabase
    .from('bet_participants')
    .select('user_id, stake_amount')
    .eq('bet_id', betId)

  if (partErr) {
    return { error: partErr.message }
  }

  const partRows = (participants ?? []) as { user_id: string; stake_amount: number | string }[]
  if (partRows.length === 0) {
    return {}
  }

  return createSettlementsFromWinner(betId, partRows)
}
