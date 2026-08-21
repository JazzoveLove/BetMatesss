
import { supabase } from '@/shared/lib/supabase'
import type { StakeMode } from '@/features/bets/types/bet.types'
import { log } from '@/shared/utils/logger'
import { createSettlementsFromWinner } from './settlements.create.winner'

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
    .select('id, stake_mode')
    .eq('id', betId)
    .maybeSingle()

  if (betErr || !bet) {
    return { error: betErr?.message ?? 'Nie znaleziono zakładu.' }
  }

  const stakeMode = (bet as { stake_mode: StakeMode }).stake_mode

  if (stakeMode === 'none') {
    const { data: checkPart } = await supabase
      .from('bet_participants')
      .select('stake_amount')
      .eq('bet_id', betId)
      .gt('stake_amount', 0)
      .limit(1)
    if (checkPart && checkPart.length > 0) {
      log('[createSettlements] stake_mode=none but participants have stake_amount>0 — treating as equal')
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

  const partRows = (participants ?? []) as { user_id: string; stake_amount: number }[]
  if (partRows.length === 0) {
    return {}
  }

  return createSettlementsFromWinner(betId, partRows)
}
