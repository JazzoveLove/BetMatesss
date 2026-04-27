import { supabase } from '../../lib/supabase'
import { parseStakeAmount } from '../../utils/odds'
import { loadNicksByIds, getAcceptedFriendsList } from '../friends.service'
import { parseOddsNumber, normalizeUsersNick } from './_helpers'
import type {
  Bet,
  ActiveBetItem,
  RecentResult,
  DashboardStats,
  BetStatus,
  HistoryListItem,
  HistoryBadgeLabel,
  DisciplineStatRow,
  FriendRankRow,
  ProfileScreenData,
} from '../../types/bet.types'

type DashboardData = {
  nick: string
  stats: DashboardStats
  activeBets: ActiveBetItem[]
  recentResults: RecentResult[]
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [profileRes, participationsRes, settlementsRes] = await Promise.all([
    supabase.from('users').select('nick').eq('id', userId).single(),
    supabase
      .from('bet_participants')
      .select(`
        stake_amount, odds,
        bets (
          id, game_template, status,
          bet_participants ( user_id, stake_amount, odds, users ( nick ) )
        )
      `)
      .eq('user_id', userId),
    supabase
      .from('settlements')
      .select('id, amount, paid, debtor_id, creditor_id, bet_id')
      .or(`debtor_id.eq.${userId},creditor_id.eq.${userId}`),
  ])

  const nick = (profileRes.data as any)?.nick ?? 'Graczu'

  const settlements = (settlementsRes.data ?? []) as {
    id: string
    amount: number
    paid: boolean
    debtor_id: string
    creditor_id: string
    bet_id: string
  }[]

  const balance = settlements.reduce((acc, s) => {
    if (s.creditor_id === userId) return acc + s.amount
    if (s.debtor_id === userId) return acc - s.amount
    return acc
  }, 0)

  const participations = (participationsRes.data ?? []) as unknown as {
    stake_amount: number | string
    odds: number | string
    bets: {
      id: string
      game_template: string
      status: string
      bet_participants: {
        user_id: string
        stake_amount?: number | string
        odds?: number | string
        users: { nick: string } | { nick: string }[] | null
      }[]
    } | null
  }[]

  type DashRow = {
    bet: NonNullable<(typeof participations)[0]['bets']>
    stakeAmount: number
    odds: number
    opponentUserId: string | null
    joinNick: string | null
  }

  const dashRows: DashRow[] = []
  for (const p of participations) {
    const bet = p.bets
    if (!bet) continue
    const opponent = bet.bet_participants.find(bp => bp.user_id !== userId)
    const joinNick = opponent ? normalizeUsersNick(opponent.users) : null
    dashRows.push({
      bet,
      stakeAmount: parseStakeAmount(p.stake_amount),
      odds: parseOddsNumber(p.odds),
      opponentUserId: opponent?.user_id ?? null,
      joinNick,
    })
  }

  const needNickIds = [
    ...new Set(
      dashRows
        .filter(r => !r.joinNick && r.opponentUserId)
        .map(r => r.opponentUserId as string),
    ),
  ]
  const extraNicks = needNickIds.length > 0 ? await loadNicksByIds(needNickIds) : {}

  const opponentNickFor = (r: DashRow) =>
    r.joinNick ?? (r.opponentUserId ? extraNicks[r.opponentUserId] : undefined) ?? 'Przeciwnik'

  const active: ActiveBetItem[] = []
  const completed: { id: string; gameTemplate: string; opponentNick: string }[] = []
  const seenBetIds = new Set<string>()

  for (const r of dashRows) {
    const { bet } = r
    if (seenBetIds.has(bet.id)) continue
    seenBetIds.add(bet.id)
    const opponentNick = opponentNickFor(r)
    if (
      bet.status === 'active' ||
      bet.status === 'pending' ||
      bet.status === 'awaiting_confirmation' ||
      bet.status === 'in_progress'
    ) {
      active.push({
        id: bet.id,
        gameTemplate: bet.game_template,
        status: bet.status as BetStatus,
        stakeAmount: r.stakeAmount,
        odds: r.odds,
        opponentNick,
      })
    } else if (bet.status === 'completed') {
      completed.push({ id: bet.id, gameTemplate: bet.game_template, opponentNick })
    }
  }

  const completedIds = new Set(completed.map(b => b.id))
  const wins = settlements.filter(s => s.creditor_id === userId && completedIds.has(s.bet_id)).length
  const winRate = completedIds.size > 0 ? Math.round((wins / completedIds.size) * 100) : 0

  const recentResults: RecentResult[] = completed.slice(0, 3).map(b => {
    const s = settlements.find(s => s.bet_id === b.id)
    const profit = s ? (s.creditor_id === userId ? s.amount : -s.amount) : 0
    return { id: b.id, gameTemplate: b.gameTemplate, opponentNick: b.opponentNick, profit }
  })

  return {
    nick,
    stats: { balance, totalBets: participations.length, winRate },
    activeBets: active,
    recentResults,
  }
}

export async function getUserBets(userId: string): Promise<Bet[]> {
  const [createdRes, participantsRes] = await Promise.all([
    supabase.from('bets').select('*').eq('creator_id', userId).order('created_at', { ascending: false }),
    supabase
      .from('bet_participants')
      .select('bets(*)')
      .eq('user_id', userId),
  ])
  const created = (createdRes.data ?? []) as Bet[]
  const participated = ((participantsRes.data ?? []) as { bets: Bet | Bet[] | null }[])
    .flatMap(row => (Array.isArray(row.bets) ? row.bets : row.bets ? [row.bets] : []))
  const byId = new Map<string, Bet>()
  for (const bet of [...created, ...participated]) byId.set(bet.id, bet)
  return [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function historyBadgeAndAmount(
  bet: Bet,
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
  const [{ data: parts }, { data: settlements }] = await Promise.all([
    supabase
      .from('bet_participants')
      .select('bet_id, user_id, users ( nick )')
      .in('bet_id', betIds),
    supabase.from('settlements').select('bet_id, debtor_id, creditor_id, amount').in('bet_id', betIds),
  ])

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
      gameTemplate: bet.game_template,
      createdAt: bet.created_at,
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
  const { data: settlements } = await supabase
    .from('settlements')
    .select('bet_id, debtor_id, creditor_id')
    .in('bet_id', betIds)

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
    const tmpl = bet.game_template
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
