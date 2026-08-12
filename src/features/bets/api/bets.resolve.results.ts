
import { supabase } from '@/shared/lib/supabase'
import { log } from '@/shared/utils/logger'
import { createSettlements } from '@/features/settlements'

type ResolveParams = {
  betId: string
  winnerId: string
  score: string
  recordedBy: string
}

type BetRowFormat = {
  format: string
  status: string
  creator_id: string
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

type MaxMatchRow = {
  match_number?: number
}

type ConfirmResultParams = {
  betId: string
  resultId: string
  confirmerId: string
}

export async function submitBetResult(params: ResolveParams): Promise<{ error?: string }> {
  const { data: betRow, error: betErr } = await supabase
    .from('bets')
    .select('format')
    .eq('id', params.betId)
    .maybeSingle()
  if (betErr) return { error: betErr.message }
  const row = betRow as { format: string } | null
  if (row?.format === 'per_match') {
    return { error: 'Ten zakład jest rozliczany mecz po meczu — użyj „Wpisz wynik meczu”.' }
  }

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

export async function submitPerMatchBetResult(params: ResolveParams): Promise<{ error?: string }> {
  const { data: betRow, error: betErr } = await supabase
    .from('bets')
    .select('format, status')
    .eq('id', params.betId)
    .maybeSingle()

  if (betErr || !betRow) return { error: betErr?.message ?? 'Nie znaleziono zakładu.' }
  const row = betRow as BetRowFormat
  if (row.format !== 'per_match') {
    return { error: 'To nie jest zakład „za mecz”.' }
  }
  if (row.status !== 'active') {
    return { error: 'Można wpisywać wyniki tylko przy aktywnej sesji.' }
  }

  const { data: maxRow, error: maxErr } = await supabase
    .from('bet_results')
    .select('match_number')
    .eq('bet_id', params.betId)
    .order('match_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (maxErr) return { error: maxErr.message }

  const nextMatch = Number((maxRow as MaxMatchRow | null)?.match_number ?? 0) + 1
  const scoreStored = params.score.trim() || '—'

  const { error: resultError } = await supabase.from('bet_results').insert({
    bet_id: params.betId,
    match_number: nextMatch,
    winner_id: params.winnerId,
    scores: { score: scoreStored },
    recorded_by: params.recordedBy,
    confirmed: true,
  })
  if (resultError) return { error: resultError.message }

  return {}
}

export async function completePerMatchSession(
  betId: string,
  userId: string,
): Promise<{ error?: string }> {
  const { data: betRow, error: betErr } = await supabase
    .from('bets')
    .select('creator_id, format, status')
    .eq('id', betId)
    .maybeSingle()

  if (betErr || !betRow) return { error: betErr?.message ?? 'Nie znaleziono zakładu.' }
  const row = betRow as BetRowFormat
  if (row.format !== 'per_match') {
    return { error: 'Ten zakład nie jest w formacie „za mecz”.' }
  }
  if (row.creator_id !== userId) {
    return { error: 'Tylko organizator może zakończyć sesję meczów.' }
  }
  if (row.status !== 'active') {
    return { error: 'Sesja nie jest aktywna.' }
  }

  const { error: updErr } = await supabase
    .from('bets')
    .update({ status: 'completed' })
    .eq('id', betId)
    .eq('status', 'active')

  if (updErr) return { error: updErr.message }

  return createSettlements(betId)
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

//Za dlgi ten plik jest chyba
