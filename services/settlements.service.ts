import { supabase } from '../lib/supabase'
import { parseStakeAmount } from '../utils/odds'
import { calculateSettlements } from '../utils/settlements'
import { loadNicksByIds } from './friends.service'
import type { Settlement, StakeMode } from '../types/bet.types'

async function getSettlements(betId: string): Promise<Settlement[]> {
  console.log('[getSettlements] start', { betId })

  const { data: rows, error } = await supabase
    .from('settlements')
    .select('id, amount, paid, debtor_id, creditor_id')
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
      }
    })
    .filter(s => s.amount > 0)

  console.log('[getSettlements] returning', result)
  return result
}

async function markSettlementPaid(settlementId: string): Promise<{ error?: string }> {
  console.log('[markSettlementPaid] start', { settlementId })

  const { error } = await supabase
    .from('settlements')
    .update({ paid: true, paid_at: new Date().toISOString() })
    .eq('id', settlementId)

  if (error) {
    console.log('[markSettlementPaid] error', error)
    return { error: error.message }
  }

  console.log('[markSettlementPaid] success', { settlementId })
  return {}
}

/**
 * Wywołana po potwierdzeniu wyniku przez gracza B.
 * Pobiera uczestników i zwycięzcę, oblicza długi, zapisuje do settlements.
 */
async function createSettlements(betId: string): Promise<{ error?: string }> {
  console.log('[createSettlements] start', { betId })

  // Sprawdź czy settlements już istnieją (idempotencja)
  const { count, error: countErr } = await supabase
    .from('settlements')
    .select('id', { count: 'exact', head: true })
    .eq('bet_id', betId)

  console.log('[createSettlements] existing count', { count, countErr })

  if (countErr) {
    console.log('[createSettlements] count error', countErr)
    return { error: countErr.message }
  }
  if (count !== null && count > 0) {
    console.log('[createSettlements] settlements already exist, skipping')
    return {}
  }

  // Pobierz stake_mode zakładu
  const { data: bet, error: betErr } = await supabase
    .from('bets')
    .select('id, stake_mode')
    .eq('id', betId)
    .maybeSingle()

  console.log('[createSettlements] bet row', { bet, betErr })

  if (betErr || !bet) {
    console.log('[createSettlements] bet not found', { betErr })
    return { error: betErr?.message ?? 'Nie znaleziono zakładu.' }
  }

  const stakeMode = (bet as { stake_mode: StakeMode }).stake_mode
  console.log('[createSettlements] stakeMode', stakeMode)

  if (stakeMode === 'none') {
    console.log('[createSettlements] stake_mode=none — brak rozliczeń finansowych')
    return {}
  }

  // Pobierz uczestników z ich stawkami
  const { data: participants, error: partErr } = await supabase
    .from('bet_participants')
    .select('user_id, stake_amount')
    .eq('bet_id', betId)

  console.log('[createSettlements] participants', { participants, partErr })

  if (partErr) {
    console.log('[createSettlements] participants error', partErr)
    return { error: partErr.message }
  }

  const rows = (participants ?? []) as { user_id: string; stake_amount: number | string }[]
  if (rows.length === 0) {
    console.log('[createSettlements] no participants found')
    return {}
  }

  // Pobierz winner_id z potwierdzonego wyniku
  const { data: resultRow, error: resErr } = await supabase
    .from('bet_results')
    .select('winner_id')
    .eq('bet_id', betId)
    .eq('confirmed', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  console.log('[createSettlements] bet_results row', { resultRow, resErr })

  if (resErr) {
    console.log('[createSettlements] bet_results error', resErr)
    return { error: resErr.message }
  }

  const winnerId = (resultRow as { winner_id?: string } | null)?.winner_id
  console.log('[createSettlements] winnerId', winnerId)

  if (!winnerId) {
    console.log('[createSettlements] no confirmed winner found')
    return { error: 'Brak potwierdzonego wyniku ze zwycięzcą.' }
  }

  // Oblicz rozliczenia: każdy przegrany jest winien zwycięzcy swoją stake_amount
  const stakes = rows.map(r => ({
    id: r.user_id,
    stakeAmount: parseStakeAmount(r.stake_amount),
  }))
  console.log('[createSettlements] stakes', stakes)

  const drafts = calculateSettlements(stakes, winnerId, stakeMode)
  console.log('[createSettlements] drafts', drafts)

  if (drafts.length === 0) {
    console.log('[createSettlements] calculateSettlements returned empty — stake_mode=none or all stakes=0?')
    return {}
  }

  const settlementRows = drafts.map(d => ({
    bet_id: betId,
    debtor_id: d.debtorId,
    creditor_id: d.creditorId,
    amount: d.amount,
    paid: false,
  }))

  console.log('[createSettlements] inserting rows', settlementRows)

  const { data: inserted, error: insErr } = await supabase
    .from('settlements')
    .insert(settlementRows)
    .select()

  console.log('[createSettlements] insert result', { inserted, insErr })

  if (insErr) {
    console.log('[createSettlements] insert error', insErr)
    return { error: insErr.message }
  }

  console.log('[createSettlements] success — created', settlementRows.length, 'settlement(s)')
  return {}
}

export const SettlementsService = {
  getSettlements,
  markSettlementPaid,
  createSettlements,
}

export { getSettlements, markSettlementPaid, createSettlements }
