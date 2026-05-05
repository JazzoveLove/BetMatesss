/** Zapytania i logika dla ekranu Dashboard */

import { supabase } from '../../lib/supabase'
import { parseStakeAmount } from '../../utils/odds'
import { loadNicksByIds } from '../friends.service'
import { parseOddsNumber, normalizeUsersNick } from './_helpers'
import type {
  ActiveBetItem,
  RecentResult,
  DashboardStats,
  BetStatus,
} from '../../types/bet.types'

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

type DashRow = {
  bet: {
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
  }
  stakeAmount: number
  odds: number
  opponentUserId: string | null
  joinNick: string | null
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
      .select('id, amount, paid, payment_status, debtor_id, creditor_id, bet_id')
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
    payment_status: 'unpaid' | 'pending_confirmation' | 'paid' | 'disputed' | null
    debtor_id: string
    creditor_id: string
    bet_id: string
  }[]

  const activeSettlements = settlements.filter(s => (s.payment_status ?? (s.paid ? 'paid' : 'unpaid')) !== 'paid')

  const balance = activeSettlements.reduce((acc, s) => {
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
  const wins = activeSettlements.filter(s => s.creditor_id === userId && completedIds.has(s.bet_id)).length
  const totalMatches = completedIds.size
  const losses = Math.max(0, totalMatches - wins)
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

  const recentResults: (RecentResult & { timeLabel: string })[] = completed.slice(0, 3).map(b => {
    const s = activeSettlements.find(s => s.bet_id === b.id)
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
