import { supabase } from '../../lib/supabase'
import { parseStakeAmount } from '../../utils/odds'
import { createSettlements, getSettlements, markSettlementPaid } from '../settlements.service'
import { parseOddsNumber, normalizeUsersNick } from './_helpers'
import type { BetDetail, BetParticipant, BetResultRow } from '../../types/bet.types'

export { getSettlements, markSettlementPaid }

export async function getBetDetail(betId: string): Promise<BetDetail | null> {
  const { data, error } = await supabase
    .from('bets')
    .select(`
      id, creator_id, game_template, format, stake_mode, status, notes, created_at, stake_per_match,
      bet_participants (
        user_id, stake_amount, odds, role, confirmed,
        users ( nick )
      ),
      bet_results (
        id, match_number, winner_id, scores, confirmed
      )
    `)
    .eq('id', betId)
    .maybeSingle()

  if (error) {
    console.error('[getBetDetail] supabase error:', error.message, { betId })
    return null
  }
  if (!data) {
    console.warn('[getBetDetail] brak danych dla betId:', betId)
    return null
  }

  const seenUserIds = new Set<string>()
  const participants: BetParticipant[] = ((data as any).bet_participants ?? [])
    .filter((bp: any) => {
      if (seenUserIds.has(bp.user_id)) return false
      seenUserIds.add(bp.user_id)
      return true
    })
    .map((bp: any) => ({
      id: bp.user_id,
      nick: normalizeUsersNick(bp.users) ?? 'Nieznany',
      stakeAmount: parseStakeAmount(bp.stake_amount),
      odds: parseOddsNumber(bp.odds),
      role: bp.role,
      confirmed: bp.confirmed,
    }))

  const rawResults = ((data as any).bet_results ?? []) as {
    id: string
    match_number: number
    winner_id: string
    scores: Record<string, unknown> | null
    confirmed: boolean
  }[]
  const results: BetResultRow[] = [...rawResults]
    .sort((a, b) => a.match_number - b.match_number)
    .map(r => ({
      id: r.id,
      bet_id: data.id,
      match_number: r.match_number,
      winner_id: r.winner_id,
      scores: (r.scores ?? {}) as Record<string, number | string>,
      confirmed: !!r.confirmed,
    }))

  const stakePm = (data as any).stake_per_match
  const stakePerMatch =
    stakePm != null && stakePm !== '' ? Number(stakePm) : undefined

  return {
    id: data.id,
    creatorId: String((data as any).creator_id ?? ''),
    gameTemplate: (data as any).game_template,
    format: (data as any).format,
    stakeMode: (data as any).stake_mode,
    status: (data as any).status,
    notes: (data as any).notes,
    createdAt: (data as any).created_at,
    stakePerMatch: Number.isFinite(stakePerMatch) ? stakePerMatch : undefined,
    participants,
    results,
  }
}

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

export async function submitBetResult(params: ResolveParams): Promise<{ error?: string }> {
  const { data: betRow } = await supabase.from('bets').select('format').eq('id', params.betId).maybeSingle()
  if ((betRow as { format?: string } | null)?.format === 'per_match') {
    return { error: 'Ten zakład jest rozliczany mecz po meczu — użyj „Wpisz wynik meczu”.' }
  }

  const { error: resultError } = await supabase.from('bet_results').insert({
    bet_id: params.betId,
    match_number: 1,
    winner_id: params.winnerId,
    scores: { score: params.score },
    recorded_by: params.recordedBy,
    confirmed: false,
  })
  if (resultError) return { error: resultError.message }

  const { error: betError } = await supabase
    .from('bets')
    .update({ status: 'awaiting_confirmation' })
    .eq('id', params.betId)
  if (betError) return { error: betError.message }

  return {}
}

export async function submitPerMatchBetResult(params: ResolveParams): Promise<{ error?: string }> {
  const { data: betRow, error: betErr } = await supabase
    .from('bets')
    .select('format, status')
    .eq('id', params.betId)
    .maybeSingle()

  if (betErr || !betRow) return { error: betErr?.message ?? 'Nie znaleziono zakładu.' }
  if ((betRow as { format?: string }).format !== 'per_match') {
    return { error: 'To nie jest zakład „za mecz”.' }
  }
  if ((betRow as { status?: string }).status !== 'active') {
    return { error: 'Można wpisywać wyniki tylko przy aktywnej sesji.' }
  }

  const { data: maxRow } = await supabase
    .from('bet_results')
    .select('match_number')
    .eq('bet_id', params.betId)
    .order('match_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextMatch = Number((maxRow as { match_number?: number } | null)?.match_number ?? 0) + 1
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
  if ((betRow as { format?: string }).format !== 'per_match') {
    return { error: 'Ten zakład nie jest w formacie „za mecz”.' }
  }
  if ((betRow as { creator_id?: string }).creator_id !== userId) {
    return { error: 'Tylko organizator może zakończyć sesję meczów.' }
  }
  if ((betRow as { status?: string }).status !== 'active') {
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

  return {
    id: (data as any).id,
    winnerId: (data as any).winner_id,
    score: String((data as any).scores?.score ?? ''),
    recordedBy: (data as any).recorded_by,
    confirmed: !!(data as any).confirmed,
  }
}

type ConfirmResultParams = {
  betId: string
  resultId: string
  confirmerId: string
}

export async function confirmBetResult(params: ConfirmResultParams): Promise<{ error?: string }> {
  console.log('[confirmBetResult] start', params)

  const { error: resultError } = await supabase
    .from('bet_results')
    .update({ confirmed: true, confirmed_by: params.confirmerId })
    .eq('id', params.resultId)
    .eq('bet_id', params.betId)

  console.log('[confirmBetResult] bet_results update', { resultError })
  if (resultError) return { error: resultError.message }

  const { error: betError } = await supabase
    .from('bets')
    .update({ status: 'completed' })
    .eq('id', params.betId)

  console.log('[confirmBetResult] bets status update', { betError })
  if (betError) return { error: betError.message }

  console.log('[confirmBetResult] calling createSettlements for betId', params.betId)
  const settlResult = await createSettlements(params.betId)
  console.log('[confirmBetResult] createSettlements result', settlResult)
  return settlResult
}

export async function disputeBetResult(betId: string): Promise<{ error?: string }> {
  const { error } = await supabase.from('bets').update({ status: 'disputed' }).eq('id', betId)
  return error ? { error: error.message } : {}
}
