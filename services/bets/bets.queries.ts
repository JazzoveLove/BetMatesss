import { supabase } from '../../lib/supabase'
import { parseStakeAmount } from '../../utils/odds'
import { loadNicksByIds, getAcceptedFriendsList } from '../friends.service'
import { parseOddsNumber, normalizeUsersNick } from './_helpers'
import type { BetRow } from '../../types/bet.row.types'
import type {
  BetSummary,
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

type DashboardStatsExtended = DashboardStats & {
  wins: number
  losses: number
  totalMatches: number
}

type DashboardData = {
  nick: string
  stats: DashboardStatsExtended
  activeBets: (ActiveBetItem & { timeLabel: string })[]
  recentResults: (RecentResult & { timeLabel: string })[]
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Teraz'
  const diff = Date.now() - date.getTime()
  const hour = 1000 * 60 * 60
  const day = hour * 24
  if (diff < hour) return '< 1h temu'
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))}h temu`
  if (diff < day * 7) return `${Math.max(1, Math.floor(diff / day))} dni temu`
  return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [profileRes, participationsRes, settlementsRes] = await Promise.all([
    supabase.from('users').select('nick').eq('id', userId).single(),
    supabase
      .from('bet_participants')
      .select(`
        stake_amount, odds,
        bets (
          id, game_template, status, created_at,
          bet_participants ( user_id, stake_amount, odds, users ( nick ) )
        )
      `)
      .eq('user_id', userId),
    supabase
      .from('settlements')
      .select('id, amount, paid, debtor_id, creditor_id, bet_id')
      .or(`debtor_id.eq.${userId},creditor_id.eq.${userId}`),
  ])
  if (profileRes.error) throw profileRes.error
  if (participationsRes.error) throw participationsRes.error
  if (settlementsRes.error) throw settlementsRes.error

  const nick = (profileRes.data as { nick: string })?.nick ?? 'Graczu'

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
      created_at: string
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

  const active: (ActiveBetItem & { timeLabel: string })[] = []
  const completed: { id: string; gameTemplate: string; opponentNick: string; createdAt: string }[] = []
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
        timeLabel: formatRelativeTime(bet.created_at),
      })
    } else if (bet.status === 'completed') {
      completed.push({
        id: bet.id,
        gameTemplate: bet.game_template,
        opponentNick,
        createdAt: bet.created_at,
      })
    }
  }

  const completedIds = new Set(completed.map(b => b.id))
  const wins = settlements.filter(s => s.creditor_id === userId && completedIds.has(s.bet_id)).length
  const totalMatches = completedIds.size
  const losses = Math.max(0, totalMatches - wins)
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

  const recentResults: (RecentResult & { timeLabel: string })[] = completed.slice(0, 3).map(b => {
    const s = settlements.find(s => s.bet_id === b.id)
    const profit = s ? (s.creditor_id === userId ? s.amount : -s.amount) : 0
    return {
      id: b.id,
      gameTemplate: b.gameTemplate,
      opponentNick: b.opponentNick,
      profit,
      timeLabel: formatRelativeTime(b.createdAt),
    }
  })

  return {
    nick,
    stats: { balance, totalBets: participations.length, winRate, wins, losses, totalMatches },
    activeBets: active.slice(0, 3),
    recentResults,
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