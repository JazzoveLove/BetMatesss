import { supabase } from '../lib/supabase'
import { calculatePerMatchBalance } from '../utils/formats'
import { parseStakeAmount } from '../utils/odds'
import { settlementDraftsFromPairBalances } from '../utils/settlements'
import { loadNicksByIds } from './friends.service'
import type { BetParticipant, BetResultRow, Settlement, StakeMode } from '../types/bet.types'

async function getSettlements(betId: string): Promise<Settlement[]> {
  console.log('[getSettlements] start', { betId })

  const { data: rows, error } = await supabase
    .from('settlements')
    .select('id, amount, paid, paid_at, debtor_id, creditor_id')
    .eq('bet_id', betId)

  console.log('[getSettlements] raw rows', { rows, error })

  if (error) {
    console.log('[getSettlements] query error', error)
    return []
  }
  if (!rows?.length) {
    console.log('[getSettlements] no rows found')
    return []
  }

  const list = rows as {
    id: string
    amount: number | string
    paid: boolean
    paid_at: string | null
    debtor_id: string
    creditor_id: string
  }[]

  const userIds = [...new Set(list.flatMap(r => [r.debtor_id, r.creditor_id]))]
  console.log('[getSettlements] loading nicks for userIds', userIds)
  const nickById = userIds.length > 0 ? await loadNicksByIds(userIds) : {}
  console.log('[getSettlements] nickById', nickById)

  const result = list
    .map(s => {
      const amount = Number(s.amount)
      return {
        id: s.id,
        debtorId: s.debtor_id,
        debtorNick: nickById[s.debtor_id] ?? 'Nieznany',
        creditorId: s.creditor_id,
        creditorNick: nickById[s.creditor_id] ?? 'Nieznany',
        amount: Number.isFinite(amount) ? amount : 0,
        paid: s.paid,
        paidAt: s.paid_at ?? undefined,
      }
    })
    .filter(s => s.amount > 0)

  console.log('[getSettlements] returning', result)
  return result
}

/**
 * Tylko dłużnik może oznaczyć zapłatę (RLS + filtr debtor_id).
 */
async function markSettlementPaid(
  settlementId: string,
  debtorId: string,
): Promise<{ error?: string }> {
  console.log('[markSettlementPaid] start', { settlementId, debtorId })

  const { error } = await supabase
    .from('settlements')
    .update({ paid: true, paid_at: new Date().toISOString() })
    .eq('id', settlementId)
    .eq('debtor_id', debtorId)

  if (error) {
    console.log('[markSettlementPaid] error', error)
    return { error: error.message }
  }

  console.log('[markSettlementPaid] success', { settlementId })
  return {}
}

export type SettlementRow = {
  bet_id: string
  debtor_id: string
  creditor_id: string
  amount: number
  paid: false
}

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
async function createSettlements(betId: string): Promise<{ error?: string }> {
  console.log('[createSettlements] step 1 start', { betId })

  const { count, error: countErr } = await supabase
    .from('settlements')
    .select('id', { count: 'exact', head: true })
    .eq('bet_id', betId)

  console.log('[createSettlements] step 2 existing settlements count', { count, countErr })

  if (countErr) {
    console.log('[createSettlements] count error', countErr)
    return { error: countErr.message }
  }
  if (count !== null && count > 0) {
    console.log('[createSettlements] step 2b settlements already exist — idempotent skip')
    return {}
  }

  console.log('[createSettlements] step 3 fetch bet stake_mode')
  const { data: bet, error: betErr } = await supabase
    .from('bets')
    .select('id, stake_mode, format, stake_per_match')
    .eq('id', betId)
    .maybeSingle()

  console.log('[createSettlements] step 3 bet row', { bet, betErr })

  if (betErr || !bet) {
    console.log('[createSettlements] bet not found', { betErr })
    return { error: betErr?.message ?? 'Nie znaleziono zakładu.' }
  }

  const stakeMode = (bet as { stake_mode: StakeMode }).stake_mode
  const betFormat = (bet as { format?: string }).format
  const stakePerMatch = Number((bet as { stake_per_match?: number | string }).stake_per_match ?? 0)
  console.log('[createSettlements] step 4 stake_mode', stakeMode)

  if (betFormat === 'per_match') {
    if (!Number.isFinite(stakePerMatch) || stakePerMatch <= 0) {
      console.log('[createSettlements] per_match: brak stawki za mecz — brak rozliczeń')
      return {}
    }

    const { data: participants, error: partErr } = await supabase
      .from('bet_participants')
      .select('user_id, stake_amount, odds, role, confirmed')
      .eq('bet_id', betId)

    if (partErr) return { error: partErr.message }

    const partRows = (participants ?? []) as {
      user_id: string
      stake_amount: number | string
      odds: number | string
      role: string
      confirmed: boolean
    }[]

    const participantsForCalc: BetParticipant[] = partRows.map(p => ({
      id: p.user_id,
      nick: '',
      stakeAmount: parseStakeAmount(p.stake_amount),
      odds: Number(p.odds) || 0,
      role: p.role,
      confirmed: p.confirmed,
    }))

    const { data: resultRows, error: resErr } = await supabase
      .from('bet_results')
      .select('id, match_number, winner_id, scores, confirmed')
      .eq('bet_id', betId)
      .order('match_number', { ascending: true })

    if (resErr) return { error: resErr.message }

    const results: BetResultRow[] = ((resultRows ?? []) as any[]).map(r => ({
      id: r.id,
      bet_id: betId,
      match_number: r.match_number,
      winner_id: r.winner_id,
      scores: (r.scores ?? {}) as Record<string, number | string>,
      confirmed: !!r.confirmed,
    }))

    const balance = calculatePerMatchBalance(results, stakePerMatch, participantsForCalc)
    const ids = partRows.map(p => p.user_id)
    const drafts = settlementDraftsFromPairBalances(balance, ids)
    console.log('[createSettlements] per_match drafts', drafts)

    if (drafts.length === 0) {
      console.log('[createSettlements] per_match: bilans zerowy — brak rozliczeń')
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
    console.log('[createSettlements] per_match — utworzono', settlementRows.length, 'rozliczenie')
    return {}
  }

  if (stakeMode === 'none') {
    console.log('[createSettlements] step 4b stake_mode=none — no settlement rows')
    return {}
  }

  console.log('[createSettlements] step 5 fetch bet_participants (user_id, stake_amount)')
  const { data: participants, error: partErr } = await supabase
    .from('bet_participants')
    .select('user_id, stake_amount')
    .eq('bet_id', betId)

  console.log('[createSettlements] step 5 participants', { participants, partErr })

  if (partErr) {
    console.log('[createSettlements] participants error', partErr)
    return { error: partErr.message }
  }

  const partRows = (participants ?? []) as { user_id: string; stake_amount: number | string }[]
  if (partRows.length === 0) {
    console.log('[createSettlements] step 5b no participants')
    return {}
  }

  console.log('[createSettlements] step 6 fetch winner_id from bet_results (confirmed=true)')
  const { data: resultRow, error: resErr } = await supabase
    .from('bet_results')
    .select('winner_id')
    .eq('bet_id', betId)
    .eq('confirmed', true)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  console.log('[createSettlements] step 6 bet_results row', { resultRow, resErr })

  if (resErr) {
    console.log('[createSettlements] bet_results error', resErr)
    return { error: resErr.message }
  }

  const winnerId = (resultRow as { winner_id?: string } | null)?.winner_id
  console.log('[createSettlements] step 7 winner_id', winnerId)

  if (!winnerId) {
    console.log('[createSettlements] step 7b no winner — abort')
    return { error: 'Brak potwierdzonego wyniku ze zwycięzcą.' }
  }

  const winnerIsParticipant = partRows.some(r => r.user_id === winnerId)
  console.log('[createSettlements] step 8 winner is among participants?', winnerIsParticipant)
  if (!winnerIsParticipant) {
    console.log('[createSettlements] step 8b winner not in participants — abort')
    return { error: 'Zwycięzca nie jest uczestnikiem zakładu.' }
  }

  console.log('[createSettlements] step 9 build rows: each loser owes winner their stake_amount')
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

  console.log('[createSettlements] step 10 drafts to insert', settlementRows)

  if (settlementRows.length === 0) {
    console.log('[createSettlements] step 10b no positive stakes for losers — nothing to insert')
    return {}
  }

  console.log('[createSettlements] step 11 insert into settlements')
  const { data: inserted, error: insErr } = await supabase
    .from('settlements')
    .insert(settlementRows)
    .select()

  console.log('[createSettlements] step 12 insert result', { inserted, insErr })

  if (insErr) {
    console.log('[createSettlements] insert error', insErr)
    return { error: insErr.message }
  }

  console.log('[createSettlements] done — created', settlementRows.length, 'settlement(s)')
  return {}
}

export const SettlementsService = {
  getSettlements,
  markSettlementPaid,
  createSettlements,
}

export { getSettlements, markSettlementPaid, createSettlements }
