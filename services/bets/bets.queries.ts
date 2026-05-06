import { supabase } from '../../lib/supabase'
import { getAcceptedFriendsList } from '../friends.service'
import { getDashboardData } from './bets.dashboard'
import { getProfileStatsV2 } from './bets.profile'
import type { BetRow } from '../../types/bet.row.types'
import type { BetSummary, DisciplineStatRow, FriendRankRow, ProfileScreenData } from '../../types/bet.types'

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
    rejectedAt: row.rejected_at ?? undefined,
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

export async function getDisciplineStatsForUser(userId: string): Promise<DisciplineStatRow[]> {
  const bets = await getUserBets(userId)
  const completed = bets.filter(b => b.status === 'completed')
  if (completed.length === 0) return []

  const betIds = completed.map(b => b.id)
  const { data: settlements, error: settlementsErr } = await supabase
    .from('settlements')
    .select('bet_id, debtor_id, creditor_id, paid, payment_status')
    .in('bet_id', betIds)
  if (settlementsErr) throw settlementsErr

  const settlementsList = (settlements ?? []) as {
    bet_id: string
    debtor_id: string
    creditor_id: string
    paid?: boolean
    payment_status?: 'unpaid' | 'pending_confirmation' | 'paid' | 'disputed' | null
  }[]

  const byTemplate = new Map<string, { w: number; l: number }>()
  for (const bet of completed) {
    const rel = settlementsList.filter(s => s.bet_id === bet.id && (s.payment_status ?? (s.paid ? 'paid' : 'unpaid')) !== 'paid')
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
    supabase.from('settlements').select('id, amount, debtor_id, creditor_id, paid, payment_status').in('debtor_id', ids),
    supabase.from('settlements').select('id, amount, debtor_id, creditor_id, paid, payment_status').in('creditor_id', ids),
  ])
  if (debtorRes.error) throw debtorRes.error
  if (creditorRes.error) throw creditorRes.error

  const seen = new Set<string>()
  const rows: { amount: number; debtor_id: string; creditor_id: string; paid?: boolean; payment_status?: 'unpaid' | 'pending_confirmation' | 'paid' | 'disputed' | null }[] = []
  for (const list of [debtorRes.data ?? [], creditorRes.data ?? []]) {
    for (const r of list as { id: string; amount: number; debtor_id: string; creditor_id: string; paid?: boolean; payment_status?: 'unpaid' | 'pending_confirmation' | 'paid' | 'disputed' | null }[]) {
      if (seen.has(r.id)) continue
      seen.add(r.id)
      rows.push({
        amount: Number(r.amount),
        debtor_id: r.debtor_id,
        creditor_id: r.creditor_id,
        paid: r.paid,
        payment_status: r.payment_status,
      })
    }
  }

  const balanceById: Record<string, number> = Object.fromEntries(ids.map(i => [i, 0]))
  for (const s of rows) {
    if ((s.payment_status ?? (s.paid ? 'paid' : 'unpaid')) === 'paid') continue
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

  const [dashboard, disciplines, friendsRank, statsV2] = await Promise.all([
    getDashboardData(userId),
    getDisciplineStatsForUser(userId),
    getFriendsBalanceLeaderboard(userId),
    getProfileStatsV2(userId),
  ])

  return {
    nick: (userRow as { nick: string }).nick,
    createdAt: (userRow as { created_at?: string | null }).created_at ?? null,
    stats: dashboard.stats,
    disciplines,
    friendsRank,
    statsV2,
  }
}