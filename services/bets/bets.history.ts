/** Zapytania i logika dla ekranu Historia */
import { supabase } from '../../lib/supabase'
import { loadNicksByIds } from '../friends.service'
import { normalizeUsersNick } from './_helpers'
import { getUserBets } from './bets.queries'
import type { BetStatus, HistoryBadgeLabel, HistoryListItem } from '../../types/bet.types'

export function historyBadgeAndAmount(
  bet: { status: BetStatus },
  profit: number,
  hadSettlement: boolean,
): { badge: HistoryBadgeLabel; amountLabel: string } {
  const st = bet.status
  if (st === 'pending') return { badge: 'oczekuje', amountLabel: '—' }
  if (st === 'disputed') return { badge: 'spór', amountLabel: '—' }
  if (st === 'active' || st === 'in_progress' || st === 'awaiting_confirmation') {
    return { badge: 'aktywny', amountLabel: '—' }
  }
  if (st === 'completed') {
    if (!hadSettlement) {
      return { badge: 'zakończony', amountLabel: '0 zł' }
    }
    const sign = profit > 0 ? '+' : ''
    if (profit === 0) {
      return { badge: 'zakończony', amountLabel: '0 zł' }
    }
    return {
      badge: profit > 0 ? 'wygrany' : 'przegrany',
      amountLabel: `${sign}${profit} zł`,
    }
  }
  return { badge: 'oczekuje', amountLabel: '—' }
}

export async function getHistoryForUser(userId: string): Promise<HistoryListItem[]> {
  const bets = await getUserBets(userId)
  if (bets.length === 0) return []

  const betIds = bets.map(b => b.id)
  const [partsRes, settlementsRes] = await Promise.all([
    supabase
      .from('bet_participants')
      .select('bet_id, user_id, users ( nick )')
      .in('bet_id', betIds),
    supabase.from('settlements').select('bet_id, debtor_id, creditor_id, amount').in('bet_id', betIds),
  ])
  if (partsRes.error) throw partsRes.error
  if (settlementsRes.error) throw settlementsRes.error

  const parts = partsRes.data
  const settlements = settlementsRes.data

  const settlementsList = (settlements ?? []) as {
    bet_id: string
    debtor_id: string
    creditor_id: string
    amount: number
  }[]

  const partsList = ((parts ?? []) as unknown as {
    bet_id: string
    user_id: string
    users: { nick: string } | { nick: string }[] | null
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
    const { badge, amountLabel } = historyBadgeAndAmount(bet, profit, hadSettlement)

    items.push({
      id: bet.id,
      gameTemplate: bet.gameTemplate,
      createdAt: bet.createdAt,
      opponentNick,
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
