import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GAME_MAP } from '../constants/games'
import { useAuthContext } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryKeys'
import { BetsService } from '../services/bets.service'
import type { ProfileScreenData, ProfileStatSection } from '../types/bet.types'

export interface ProfileData {
  user: {
    nick: string
    fullName?: string
    initials: string
    avatarUrl?: string
    memberSince: string
    showBalance: boolean
  }
  stats: {
    totalMatches: number
    winRate: number
    balance: number
    disciplines: number
    friends: number
    currentStreak: number
    wins: number
    losses: number
  }
  disciplineStats: Array<{
    gameId: string
    gameName: string
    gameEmoji: string
    wins: number
    losses: number
    total: number
    winRate: number
    balance: number
    hasStake: boolean
  }>
  moneyStats: ProfileStatSection | null
  friendlyStats: ProfileStatSection | null
  loading: boolean
}

function getInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function formatMemberSince(dateInput: string | null): string {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(date)
}

function mapToProfileData(row: ProfileScreenData): ProfileData {
  const { overall, money } = row.statsV2

  const moneyBalanceByTemplate = new Map<string, number>(
    (money?.disciplines ?? []).map(d => [d.gameTemplate, d.balance]),
  )

  const disciplineStats = overall.disciplines.map(item => {
    const game = GAME_MAP[item.gameTemplate] ?? { label: item.gameTemplate, emoji: '🎲' }
    const moneyBalance = moneyBalanceByTemplate.get(item.gameTemplate) ?? 0
    return {
      gameId: item.gameTemplate,
      gameName: game.label,
      gameEmoji: game.emoji,
      wins: item.wins,
      losses: item.losses,
      total: item.wins + item.losses,
      winRate: item.winPct,
      balance: moneyBalance,
      hasStake: moneyBalance !== 0,
    }
  })

  return {
    user: {
      nick: row.nick,
      fullName: undefined,
      initials: getInitials(row.nick),
      avatarUrl: undefined,
      memberSince: formatMemberSince(row.createdAt),
      showBalance: true,
    },
    stats: {
      totalMatches: overall.wins + overall.losses,
      winRate: overall.winRate,
      balance: row.stats.balance,
      disciplines: disciplineStats.length,
      friends: row.friendsRank.length,
      currentStreak: 0,
      wins: overall.wins,
      losses: overall.losses,
    },
    disciplineStats,
    moneyStats: row.statsV2.money,
    friendlyStats: row.statsV2.friendly,
    loading: false,
  }
}

export function useProfile() {
  const { userId } = useAuthContext()

  const { data: raw, isLoading, isRefetching, refetch } = useQuery({
    queryKey: queryKeys.profile(userId ?? ''),
    queryFn: () => BetsService.getProfileScreenData(userId!),
    enabled: !!userId,
  })

  const data = useMemo(() => (raw ? mapToProfileData(raw) : null), [raw])

  return {
    loading: isLoading,
    refreshing: isRefetching,
    data,
    onRefresh: refetch,
    reload: refetch,
  }
}
