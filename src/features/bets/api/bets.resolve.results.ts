
import { supabase } from '@/shared/lib/supabase'
import { log } from '@/shared/utils/logger'
import { createSettlements } from '@/features/settlements'

type ResolveParams = {
  betId: string
  winnerId: string
  score: string
  recordedBy: string
}

export type PendingBetResult = {
  id: string
  winnerId: string
  score: string
  recordedBy: string
  confirmed: boolean
}

type PendingBetResultRow = {
  id: string
  winner_id: string
  scores: { score?: string } | null
  recorded_by: string
  confirmed: boolean
}

type ConfirmResultParams = {
  betId: string
  resultId: string
  confirmerId: string
}

export async function submitBetResult(params: ResolveParams): Promise<{ error?: string }> {
  const { error: rpcError } = await supabase.rpc('submit_bet_result', {
    p_bet_id: params.betId,
    p_winner_id: params.winnerId,
    p_score: params.score,
    p_recorded_by: params.recordedBy,
  })

  if (rpcError) {
    if (rpcError.code === '23505') {
      return { error: 'Ktoś już wpisał wynik dla tego zakładu — odśwież ekran.' }
    }
    return { error: rpcError.message }
  }

  return {}
}

export function canConfirmResult(
  pendingResult: PendingBetResult | null,
  currentUserId: string,
): boolean {
  return !!pendingResult && pendingResult.recordedBy !== currentUserId
}

export async function getPendingBetResult(betId: string): Promise<PendingBetResult | null> {
  const { data, error } = await supabase
    .from('bet_results')
    .select('id, winner_id, scores, recorded_by, confirmed')
    .eq('bet_id', betId)
    .eq('confirmed', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  const pending = data as PendingBetResultRow

  return {
    id: pending.id,
    winnerId: pending.winner_id,
    score: String(pending.scores?.score ?? ''),
    recordedBy: pending.recorded_by,
    confirmed: !!pending.confirmed,
  }
}

export async function confirmBetResult(params: ConfirmResultParams): Promise<{ error?: string }> {
  log('[confirmBetResult] start', params)

  const { data: pendingRow, error: fetchError } = await supabase
    .from('bet_results')
    .select('recorded_by')
    .eq('id', params.resultId)
    .eq('bet_id', params.betId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!pendingRow) return { error: 'Nie znaleziono wyniku do potwierdzenia.' }
  if ((pendingRow as { recorded_by: string }).recorded_by === params.confirmerId) {
    return { error: 'Nie możesz potwierdzić własnego wyniku — musi to zrobić druga strona.' }
  }

  const { data: updatedRows, error: resultError } = await supabase
    .from('bet_results')
    .update({ confirmed: true, confirmed_by: params.confirmerId })
    .eq('id', params.resultId)
    .eq('bet_id', params.betId)
    .eq('confirmed', false)
    .select('id')

  log('[confirmBetResult] bet_results update', { resultError })
  if (resultError) return { error: resultError.message }
  if (!updatedRows || updatedRows.length === 0) {
    return { error: 'Ten wynik został już rozstrzygnięty.' }
  }

  const { error: betError } = await supabase
    .from('bets')
    .update({ status: 'completed' })
    .eq('id', params.betId)

  log('[confirmBetResult] bets status update', { betError })
  if (betError) return { error: betError.message }

  log('[confirmBetResult] calling createSettlements for betId', params.betId)
  const settlResult = await createSettlements(params.betId)
  log('[confirmBetResult] createSettlements result', settlResult)
  return settlResult
}

export async function disputeBetResult(betId: string): Promise<{ error?: string }> {
  const { data: updatedRows, error } = await supabase
    .from('bets')
    .update({ status: 'disputed' })
    .eq('id', betId)
    .eq('status', 'awaiting_confirmation')
    .select('id')

  if (error) return { error: error.message }
  if (!updatedRows || updatedRows.length === 0) {
    return { error: 'Nie można zgłosić sporu — zakład nie czeka już na potwierdzenie.' }
  }
  return {}
}

export async function cancelDisputedBet(betId: string): Promise<{ error?: string }> {
  const { data: updatedRows, error } = await supabase
    .from('bets')
    .update({ status: 'cancelled' })
    .eq('id', betId)
    .eq('status', 'disputed')
    .select('id')

  if (error) return { error: error.message }
  if (!updatedRows || updatedRows.length === 0) {
    return { error: 'Nie można anulować — zakład nie jest już w sporze.' }
  }
  return {}
}
