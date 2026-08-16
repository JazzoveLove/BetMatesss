
import { supabase } from '@/shared/lib/supabase'
import { parseStakeAmount } from '@/features/bets/utils/odds'
import type { BetParticipantStakeRow } from './settlements.types'

export async function createSettlementsFromWinner(
  betId: string,
  partRows: BetParticipantStakeRow[],
): Promise<{ error?: string }> {
  const { data: resultRow, error: resErr } = await supabase
    .from('bet_results')
    .select('winner_id')
    .eq('bet_id', betId)
    .eq('confirmed', true)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (resErr) {
    return { error: resErr.message }
  }

  const winnerId = (resultRow as { winner_id?: string } | null)?.winner_id

  if (!winnerId) {
    return { error: 'Brak potwierdzonego wyniku ze zwycięzcą.' }
  }

  const winnerIsParticipant = partRows.some(r => r.user_id === winnerId)
  if (!winnerIsParticipant) {
    return { error: 'Zwycięzca nie jest uczestnikiem zakładu.' }
  }

  const settlementRows = partRows
    .filter(p => p.user_id !== winnerId)
    .map(p => {
      const stake = Math.round(parseStakeAmount(p.stake_amount))
      if (stake <= 0) return null
      return {
        bet_id: betId,
        debtor_id: p.user_id,
        creditor_id: winnerId,
        amount: stake,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  if (settlementRows.length === 0) {
    return {}
  }

  const { error: insErr } = await supabase
    .from('settlements')
    .insert(settlementRows)
    .select()

  if (insErr) {
    return { error: insErr.message }
  }

  return {}
}
