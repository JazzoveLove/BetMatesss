/** Tworzenie rozliczeń dla formatu winner takes all */

import { supabase } from '../../lib/supabase'
import { log } from '../../utils/logger'
import { parseStakeAmount } from '../../utils/odds'
import type { BetParticipantStakeRow } from './settlements.types'

export async function createSettlementsFromWinner(
  betId: string,
  partRows: BetParticipantStakeRow[],
): Promise<{ error?: string }> {
  log('[createSettlements] step 6 fetch winner_id from bet_results (confirmed=true)')
  const { data: resultRow, error: resErr } = await supabase
    .from('bet_results')
    .select('winner_id')
    .eq('bet_id', betId)
    .eq('confirmed', true)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  log('[createSettlements] step 6 bet_results row', { resultRow, resErr })

  if (resErr) {
    log('[createSettlements] bet_results error', resErr)
    return { error: resErr.message }
  }

  const winnerId = (resultRow as { winner_id?: string } | null)?.winner_id
  log('[createSettlements] step 7 winner_id', winnerId)

  if (!winnerId) {
    log('[createSettlements] step 7b no winner — abort')
    return { error: 'Brak potwierdzonego wyniku ze zwycięzcą.' }
  }

  const winnerIsParticipant = partRows.some(r => r.user_id === winnerId)
  log('[createSettlements] step 8 winner is among participants?', winnerIsParticipant)
  if (!winnerIsParticipant) {
    log('[createSettlements] step 8b winner not in participants — abort')
    return { error: 'Zwycięzca nie jest uczestnikiem zakładu.' }
  }

  log('[createSettlements] step 9 build rows: each loser owes winner their stake_amount')
  const settlementRows = partRows
    .filter(p => p.user_id !== winnerId)
    .map(p => {
      const stake = parseStakeAmount(p.stake_amount)
      if (stake <= 0) return null
      return {
        bet_id: betId,
        debtor_id: p.user_id,
        creditor_id: winnerId,
        amount: stake,
        paid: false,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  log('[createSettlements] step 10 drafts to insert', settlementRows)

  if (settlementRows.length === 0) {
    log('[createSettlements] step 10b no positive stakes for losers — nothing to insert')
    return {}
  }

  log('[createSettlements] step 11 insert into settlements')
  const { data: inserted, error: insErr } = await supabase
    .from('settlements')
    .insert(settlementRows)
    .select()

  log('[createSettlements] step 12 insert result', { inserted, insErr })

  if (insErr) {
    log('[createSettlements] insert error', insErr)
    return { error: insErr.message }
  }

  log('[createSettlements] done — created', settlementRows.length, 'settlement(s)')
  return {}
}
