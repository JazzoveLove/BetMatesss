/** Pobieranie danych rywalizacji z bazy */

import { supabase } from '../../lib/supabase'
import { mapBetRowsToRivalryMatchItems } from './mapRivalryItems'
import type { RivalryData, RivalryPaymentRow } from './rivalry.types'

type FriendRow = { nick: string }

type RivalryRow = {
  id: string
  game_template: string
  participant_ids: string[]
}

type BetRow = {
  id: string
  rivalry_id: string
  game_template: string
  created_at: string
  stake_mode: string
}

type ResultRow = {
  bet_id: string
  winner_id: string | null
  scores: { score?: string } | null
}

type SettlementRow = {
  bet_id: string
  debtor_id: string
  creditor_id: string
  amount: number
  payment_status?: 'unpaid' | 'pending_confirmation' | 'paid' | 'disputed' | null
}

type ParticipantRow = {
  bet_id: string
  user_id: string
  stake_amount: number | string
}

/** Błąd pobierania po ustaliu nicku znajomego — zachowuje friendNick jak w poprzednim load. */
export class RivalryFetchError extends Error {
  constructor(
    message: string,
    public readonly friendNick: string,
  ) {
    super(message)
    this.name = 'RivalryFetchError'
  }
}

export async function fetchRivalryData(
  userId: string,
  friendId: string,
  gameTemplate: string | null,
): Promise<RivalryData> {
  const { data: friendRow } = await supabase
    .from('users')
    .select('nick')
    .eq('id', friendId)
    .maybeSingle()
    .returns<FriendRow>()
  const friendNick = friendRow?.nick ?? 'Znajomy'

  const { data: rivalries, error: rivalriesError } = await supabase
    .from('rivalries')
    .select('id, game_template, participant_ids')
    .contains('participant_ids', [userId, friendId])
    .returns<RivalryRow[]>()

  if (rivalriesError) {
    throw new RivalryFetchError(rivalriesError.message, friendNick)
  }

  const rivalryRows = rivalries ?? []

  const oneOnOneRivalries = rivalryRows.filter(row => {
    const ids = row.participant_ids ?? []
    return ids.length === 2 && ids.includes(userId) && ids.includes(friendId)
  })

  const filteredByTemplate = gameTemplate
    ? oneOnOneRivalries.filter(row => row.game_template === gameTemplate)
    : oneOnOneRivalries

  if (filteredByTemplate.length === 0) {
    const { data: pairSettlements } = await supabase
      .from('settlements')
      .select('bet_id, debtor_id, creditor_id, amount, payment_status')
      .or(`and(debtor_id.eq.${userId},creditor_id.eq.${friendId}),and(debtor_id.eq.${friendId},creditor_id.eq.${userId})`)
      .returns<SettlementRow[]>()

    const payments: RivalryPaymentRow[] = (pairSettlements ?? []).map(row => ({
      betId: row.bet_id,
      fromUserId: row.debtor_id,
      toUserId: row.creditor_id,
      amount: Number(row.amount) || 0,
      paymentStatus: row.payment_status ?? 'unpaid',
    }))
    return { friendNick, matches: [], payments }
  }

  const rivalryById = new Map(filteredByTemplate.map(r => [r.id, r]))
  const rivalryIds = filteredByTemplate.map(r => r.id)

  const [{ data: bets, error: betsError }, { data: results, error: resultsError }, { data: settlements, error: settlementsError }, { data: betParticipants, error: participantsError }, { data: pairSettlements, error: pairSettlementsError }] =
    await Promise.all([
      supabase
        .from('bets')
        .select('id, rivalry_id, game_template, created_at, stake_mode, status')
        .in('rivalry_id', rivalryIds)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .returns<BetRow[]>(),
      supabase
        .from('bet_results')
        .select('bet_id, winner_id, scores, confirmed, created_at')
        .eq('confirmed', true)
        .returns<ResultRow[]>(),
      supabase
        .from('settlements')
        .select('bet_id, debtor_id, creditor_id, amount, payment_status')
        .returns<SettlementRow[]>(),
      supabase
        .from('bet_participants')
        .select('bet_id, user_id, stake_amount')
        .eq('user_id', userId)
        .returns<ParticipantRow[]>(),
      supabase
        .from('settlements')
        .select('bet_id, debtor_id, creditor_id, amount, payment_status')
        .or(`and(debtor_id.eq.${userId},creditor_id.eq.${friendId}),and(debtor_id.eq.${friendId},creditor_id.eq.${userId})`)
        .returns<SettlementRow[]>(),
    ])

  if (betsError || resultsError || settlementsError || participantsError || pairSettlementsError) {
    throw new RivalryFetchError(
      betsError?.message ??
        resultsError?.message ??
        settlementsError?.message ??
        participantsError?.message ??
        pairSettlementsError?.message ??
        'Nie udało się pobrać rywalizacji.',
      friendNick,
    )
  }

  const betRows = bets ?? []
  const betIds = new Set(betRows.map(b => b.id))

  const resultByBetId = new Map<string, { winner_id: string | null; scores: { score?: string } | null }>()
  for (const row of results ?? []) {
    if (!betIds.has(row.bet_id)) continue
    if (!resultByBetId.has(row.bet_id)) resultByBetId.set(row.bet_id, row)
  }

  const settlementByBetId = new Map<string, { debtor_id: string; creditor_id: string; amount: number }[]>()
  for (const row of settlements ?? []) {
    if (!betIds.has(row.bet_id)) continue
    const list = settlementByBetId.get(row.bet_id) ?? []
    list.push(row)
    settlementByBetId.set(row.bet_id, list)
  }

  const stakeByBetId = new Map<string, number>()
  for (const row of betParticipants ?? []) {
    const amount = Number(row.stake_amount)
    stakeByBetId.set(row.bet_id, Number.isFinite(amount) ? amount : 0)
  }

  const matches = mapBetRowsToRivalryMatchItems(
    betRows,
    rivalryById,
    resultByBetId,
    settlementByBetId,
    stakeByBetId,
    userId,
  )

  const payments: RivalryPaymentRow[] = (pairSettlements ?? []).map(row => ({
    betId: row.bet_id,
    fromUserId: row.debtor_id,
    toUserId: row.creditor_id,
    amount: Number(row.amount) || 0,
    paymentStatus: row.payment_status ?? 'unpaid',
  }))

  return { friendNick, matches, payments }
}
