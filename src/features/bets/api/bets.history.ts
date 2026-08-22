import { supabase } from '@/shared/lib/supabase'
import { loadNicksByIds } from '@/features/friends'
import { normalizeUsersNick } from './_helpers'
import { getUserBets } from './bets.userBets'
import type { BetStatus, HistoryBadgeLabel, HistoryListItem } from '@/features/bets/types/bet.types'

export const NO_STAKE_LABEL = 'bez stawki'
export const NO_SETTLEMENT_LABEL = 'bez rozliczenia'

export function historyBadgeAndAmount(
  bet: { status: BetStatus },
  profit: number,
  hadSettlement: boolean,
  didWin: boolean | null,
): { badge: HistoryBadgeLabel; amountLabel: string } {
  const st = bet.status
  if (st === 'pending') return { badge: 'oczekuje', amountLabel: '—' }
  if (st === 'rejected') return { badge: 'odrzucony', amountLabel: '—' }
  if (st === 'cancelled') return { badge: 'anulowany', amountLabel: NO_SETTLEMENT_LABEL }
  if (st === 'disputed') return { badge: 'spór', amountLabel: '—' }
  if (st === 'active' || st === 'awaiting_confirmation') {
    return { badge: 'aktywny', amountLabel: '—' }
  }
  if (st === 'completed') {
    const amountLabel = !hadSettlement
      ? NO_STAKE_LABEL
      : profit === 0
        ? '0 j.'
        : `${profit > 0 ? '+' : ''}${profit} j.`
    if (didWin !== null) {
      return { badge: didWin ? 'wygrany' : 'przegrany', amountLabel }
    }
    if (!hadSettlement || profit === 0) {
      return { badge: 'zakończony', amountLabel }
    }
    return { badge: profit > 0 ? 'wygrany' : 'przegrany', amountLabel }
  }
  return { badge: 'oczekuje', amountLabel: '—' }
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export async function getHistoryForUser(userId: string): Promise<HistoryListItem[]> {
  const allBets = await getUserBets(userId)
  const bets = allBets.filter(b => {
    if (b.status !== 'rejected') return true
    if (!b.rejectedAt) return false
    return Date.now() - new Date(b.rejectedAt).getTime() < TWENTY_FOUR_HOURS_MS
  })
  if (bets.length === 0) return []

  const betIds = bets.map(b => b.id)
  const completedIds = bets.filter(b => b.status === 'completed').map(b => b.id)

  const [partsRes, settlementsRes, resultsRes] = await Promise.all([
    supabase
      .from('bet_participants')
      .select('bet_id, user_id, users ( nick, deleted_at )')
      .in('bet_id', betIds),
    supabase.from('settlements').select('bet_id, debtor_id, creditor_id, amount').in('bet_id', betIds),
    completedIds.length > 0
      ? supabase.from('bet_results').select('bet_id, winner_id').in('bet_id', completedIds).eq('confirmed', true)
      : Promise.resolve({ data: [] as { bet_id: string; winner_id: string }[], error: null }),
  ])
  if (partsRes.error) throw partsRes.error
  if (settlementsRes.error) throw settlementsRes.error
  if (resultsRes.error) throw resultsRes.error

  const parts = partsRes.data
  const settlements = settlementsRes.data

  const winnerByBet = new Map<string, string>()
  for (const r of (resultsRes.data ?? []) as { bet_id: string; winner_id: string }[]) {
    winnerByBet.set(r.bet_id, r.winner_id)
  }

  const settlementsList = (settlements ?? []) as {
    bet_id: string
    debtor_id: string
    creditor_id: string
    amount: number
  }[]

  const partsList = ((parts ?? []) as unknown as {
    bet_id: string
    user_id: string
    users: { nick: string; deleted_at: string | null } | { nick: string; deleted_at: string | null }[] | null
  }[]).map(p => ({
    bet_id: p.bet_id,
    user_id: p.user_id,
    nick: normalizeUsersNick(p.users),
  }))

  const byBetParts = new Map<string, typeof partsList>()
  for (const p of partsList) {
    const arr = byBetParts.get(p.bet_id) ?? []
    arr.push(p)
    byBetParts.set(p.bet_id, arr)
  }

  const items: HistoryListItem[] = []
  const betOpponentId = new Map<string, string>()
  for (const bet of bets) {
    const plist = byBetParts.get(bet.id) ?? []
    const opponent = plist.find(p => p.user_id !== userId)
    const joinNick = opponent?.nick ?? null
    if (opponent?.user_id) betOpponentId.set(bet.id, opponent.user_id)
    const opponentNick = joinNick ?? 'Przeciwnik'

    const betSettle = settlementsList.filter(s => s.bet_id === bet.id)
    let profit = 0
    for (const s of betSettle) {
      if (s.creditor_id === userId) profit += Number(s.amount)
      if (s.debtor_id === userId) profit -= Number(s.amount)
    }
    const hadSettlement = betSettle.length > 0
    const winnerId = winnerByBet.get(bet.id) ?? null
    const didWin = winnerId ? winnerId === userId : null
    const { badge, amountLabel } = historyBadgeAndAmount(bet, profit, hadSettlement, didWin)

    items.push({
      id: bet.id,
      gameTemplate: bet.gameTemplate,
      createdAt: bet.createdAt,
      opponentNick,
      opponentId: opponent?.user_id ?? '',
      badge,
      amountLabel,
      profit,
    })
  }

  const missingOppIds = [
    ...new Set(
      items
        .filter(i => i.opponentNick === 'Przeciwnik')
        .map(i => betOpponentId.get(i.id))
        .filter((id): id is string => !!id),
    ),
  ]
  if (missingOppIds.length === 0) return items
  const extra = await loadNicksByIds(missingOppIds)
  return items.map(item => {
    const oid = betOpponentId.get(item.id)
    if (item.opponentNick === 'Przeciwnik' && oid && extra[oid]) {
      return { ...item, opponentNick: extra[oid] }
    }
    return item
  })
}
