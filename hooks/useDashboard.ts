import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryKeys'
import { BetsService } from '../services/bets.service'
import { GAME_MAP } from '../constants/games'

type DashboardUser = {
  nick: string
  avatarInitials: string
}

type DashboardStats = {
  wins: number
  losses: number
  winRate: number
  totalMatches: number
  balance: number
}

type ActiveDashboardBet = {
  id: string
  opponentNick: string
  opponentInitials: string
  game: string
  amount: number
  timeLabel: string
  status: 'pending' | 'active' | 'enter_result'
}

type RecentDashboardMatch = {
  id: string
  opponentNick: string
  opponentInitials: string
  game: string
  amount: number
  dateLabel: string
  result: 'win' | 'loss'
}

function getInitials(nick: string): string {
  const parts = nick.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function mapActiveStatus(rawStatus: string): 'pending' | 'active' | 'enter_result' {
  if (rawStatus === 'awaiting_confirmation') return 'enter_result'
  if (rawStatus === 'active' || rawStatus === 'in_progress') return 'active'
  return 'pending'
}

function mapGame(gameTemplate: string): string {
  return GAME_MAP[gameTemplate]?.label ?? gameTemplate
}

export function useDashboard() {
  const { userId } = useAuthContext()

  const { data: raw, isLoading } = useQuery({
    queryKey: queryKeys.dashboard(userId ?? ''),
    queryFn: () => BetsService.getDashboardData(userId!),
    enabled: !!userId,
  })

  const user = useMemo<DashboardUser>(
    () => raw
      ? { nick: raw.nick, avatarInitials: getInitials(raw.nick) }
      : { nick: '', avatarInitials: '?' },
    [raw],
  )

  const stats = useMemo<DashboardStats>(
    () => raw
      ? {
          wins: raw.stats.wins,
          losses: raw.stats.losses,
          winRate: raw.stats.winRate,
          totalMatches: raw.stats.totalMatches,
          balance: raw.stats.balance,
        }
      : { wins: 0, losses: 0, winRate: 0, totalMatches: 0, balance: 0 },
    [raw],
  )

  const activeBets = useMemo<ActiveDashboardBet[]>(
    () => (raw?.activeBets ?? []).map(item => ({
      id: item.id,
      opponentNick: item.opponentNick,
      opponentInitials: getInitials(item.opponentNick),
      game: mapGame(item.gameTemplate),
      amount: item.stakeAmount,
      timeLabel: item.timeLabel,
      status: mapActiveStatus(item.status),
    })),
    [raw],
  )

  const recentMatches = useMemo<RecentDashboardMatch[]>(
    () => (raw?.recentResults ?? []).map(item => ({
      id: item.id,
      opponentNick: item.opponentNick,
      opponentInitials: getInitials(item.opponentNick),
      game: mapGame(item.gameTemplate),
      amount: item.profit,
      dateLabel: item.timeLabel,
      result: item.profit >= 0 ? 'win' : 'loss',
    })),
    [raw],
  )

  return { loading: isLoading, user, stats, activeBets, recentMatches }
}
