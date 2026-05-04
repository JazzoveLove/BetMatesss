import { supabase } from '../../lib/supabase'
import { loadNicksByIds, getAcceptedFriendsList } from '../friends.service'
import { normalizeUsersNick } from './_helpers'
import { getDashboardData } from './bets.dashboard'
import type { BetRow } from '../../types/bet.row.types'
import type {
  BetSummary,
  BetStatus,
  HistoryListItem,
  HistoryBadgeLabel,
  DisciplineStatRow,
  FriendRankRow,
  ProfileScreenData,
} from '../../types/bet.types'

function mapBetRowToBetSummary(row: BetRow): BetSummary {
  return {
    id: row.id,
    creatorId: row.creator_id,
    gameTemplate: row.game_template,
    format: row.format,
    stakeMode: row.stake_mode,
    status: row.status,
    notes: row.notes ?? null,
    createdAt: row.created_at,
    stakePerMatch: row.stake_per_match,
    rivalryId: row.rivalry_id,
    sessionId: row.session_id,
    bracketMode: row.bracket_mode,
    pokerMode: row.poker_mode,
    pokerStack: row.poker_stack,
    pokerRebuyStack: row.poker_rebuy_stack,
    bestOfCount: row.best_of_count,
  }
}

export async function getUserBets(userId: string): Promise<BetSummary[]> {
  const [createdRes, participantsRes] = await Promise.all([
    supabase.from('bets').select('*').eq('creator_id', userId).order('created_at', { ascending: false }),
    supabase
      .from('bet_participants')
      .select('bets(*)')
      .eq('user_id', userId),
  ])
  if (createdRes.error) throw createdRes.error
  if (participantsRes.error) throw participantsRes.error

  const created = (createdRes.data ?? []) as BetRow[]
  const participated = ((participantsRes.data ?? []) as { bets: BetRow | BetRow[] | null }[])
    .flatMap(row => (Array.isArray(row.bets) ? row.bets : row.bets ? [row.bets] : []))
  const byId = new Map<string, BetRow>()
  for (const bet of [...created, ...participated]) byId.set(bet.id, bet)
  return [...byId.values()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(mapBetRowToBetSummary)
}

export async function getUserBetSummaries(userId: string): Promise<BetSummary[]> {
  return getUserBets(userId)
}

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

export async function getDisciplineStatsForUser(userId: string): Promise<DisciplineStatRow[]> {
  const bets = await getUserBets(userId)
  const completed = bets.filter(b => b.status === 'completed')
  if (completed.length === 0) return []

  const betIds = completed.map(b => b.id)
  const { data: settlements, error: settlementsErr } = await supabase
    .from('settlements')
    .select('bet_id, debtor_id, creditor_id')
    .in('bet_id', betIds)
  if (settlementsErr) throw settlementsErr

  const settlementsList = (settlements ?? []) as {
    bet_id: string
    debtor_id: string
    creditor_id: string
  }[]

  const byTemplate = new Map<string, { w: number; l: number }>()
  for (const bet of completed) {
    const rel = settlementsList.filter(s => s.bet_id === bet.id)
    if (rel.length === 0) continue
    const won = rel.some(s => s.creditor_id === userId)
    const lost = rel.some(s => s.debtor_id === userId)
    if (!won && !lost) continue
    const tmpl = bet.gameTemplate
    const agg = byTemplate.get(tmpl) ?? { w: 0, l: 0 }
    if (won) agg.w += 1
    else if (lost) agg.l += 1
    byTemplate.set(tmpl, agg)
  }

  return [...byTemplate.entries()]
    .map(([gameTemplate, { w, l }]) => ({
      gameTemplate,
      wins: w,
      losses: l,
      winPct: w + l > 0 ? Math.round((w / (w + l)) * 100) : 0,
    }))
    .sort((a, b) => b.wins + b.losses - (a.wins + a.losses))
}

export async function getFriendsBalanceLeaderboard(userId: string): Promise<FriendRankRow[]> {
  const friends = await getAcceptedFriendsList(userId)
  if (friends.length === 0) return []

  const ids = friends.map(f => f.id)
  const [debtorRes, creditorRes] = await Promise.all([
    supabase.from('settlements').select('id, amount, debtor_id, creditor_id').in('debtor_id', ids),
    supabase.from('settlements').select('id, amount, debtor_id, creditor_id').in('creditor_id', ids),
  ])
  if (debtorRes.error) throw debtorRes.error
  if (creditorRes.error) throw creditorRes.error

  const seen = new Set<string>()
  const rows: { amount: number; debtor_id: string; creditor_id: string }[] = []
  for (const list of [debtorRes.data ?? [], creditorRes.data ?? []]) {
    for (const r of list as { id: string; amount: number; debtor_id: string; creditor_id: string }[]) {
      if (seen.has(r.id)) continue
      seen.add(r.id)
      rows.push({
        amount: Number(r.amount),
        debtor_id: r.debtor_id,
        creditor_id: r.creditor_id,
      })
    }
  }

  const balanceById: Record<string, number> = Object.fromEntries(ids.map(i => [i, 0]))
  for (const s of rows) {
    if (ids.includes(s.creditor_id)) balanceById[s.creditor_id] += s.amount
    if (ids.includes(s.debtor_id)) balanceById[s.debtor_id] -= s.amount
  }

  return friends
    .map(f => ({ id: f.id, nick: f.nick, balance: balanceById[f.id] ?? 0 }))
    .sort((a, b) => b.balance - a.balance)
}

export async function getProfileScreenData(userId: string): Promise<ProfileScreenData | null> {
  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('nick, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (userErr || !userRow) return null

  const [dashboard, disciplines, friendsRank] = await Promise.all([
    getDashboardData(userId),
    getDisciplineStatsForUser(userId),
    getFriendsBalanceLeaderboard(userId),
  ])

  return {
    nick: (userRow as { nick: string }).nick,
    createdAt: (userRow as { created_at?: string | null }).created_at ?? null,
    stats: dashboard.stats,
    disciplines,
    friendsRank,
  }
}