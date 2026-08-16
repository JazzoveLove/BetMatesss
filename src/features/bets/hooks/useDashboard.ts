import { useCallback, useMemo } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/features/auth'
import { queryKeys } from '@/shared/lib/queryKeys'
import { BetsService } from '@/features/bets/api'
import { GAME_MAP } from '@/shared/constants/games'
import { getInitials } from '@/shared/utils/text'
import type { DashboardStats } from '@/features/bets/components/dashboard/DashboardStatsRow'

type DashboardUser = {
  nick: string
  avatarInitials: string
}

type ActiveDashboardBet = {
  id: string
  opponentNick: string
  opponentInitials: string
  opponentId: string
  game: string
  amount: number
  timeLabel: string
  status: 'pending' | 'active' | 'enter_result'
}

type RecentDashboardMatch = {
  id: string
  opponentNick: string
  opponentInitials: string
  opponentId: string
  game: string
  amount: number
  dateLabel: string
  result: 'win' | 'loss'
}

function mapActiveStatus(rawStatus: string): 'pending' | 'active' | 'enter_result' {
  if (rawStatus === 'awaiting_confirmation') return 'enter_result'
  if (rawStatus === 'active') return 'active'
  return 'pending'
}

function mapGame(gameTemplate: string): string {
  return GAME_MAP[gameTemplate]?.label ?? gameTemplate
}

export function useDashboard() {
  const { userId } = useAuthContext()

  const { data: raw, isLoading, refetch } = useQuery({
    queryKey: queryKeys.dashboard(userId ?? ''),
    queryFn: () => BetsService.getDashboardData(userId!),
    enabled: !!userId,
  })

  useFocusEffect(
    useCallback(() => {
      if (userId) void refetch()
    }, [userId, refetch]),
  )

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
      opponentId: item.opponentId,
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
      opponentId: item.opponentId,
      game: mapGame(item.gameTemplate),
      amount: item.profit,
      dateLabel: item.timeLabel,
      result: item.won ? 'win' : 'loss',
    })),
    [raw],
  )

  return { loading: isLoading, user, stats, activeBets, recentMatches }
}
