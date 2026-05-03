import { useCallback, useEffect, useState } from 'react'
import { GAME_MAP } from '../constants/games'
import { AuthService } from '../services/auth.service'
import { BetsService } from '../services/bets.service'
import type { ProfileScreenData } from '../types/bet.types'
import { error } from '../utils/logger'

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
  const disciplineStats = row.disciplines.map(item => {
    const game = GAME_MAP[item.gameTemplate] ?? { label: item.gameTemplate, emoji: '🎲' }
    return {
      gameId: item.gameTemplate,
      gameName: game.label,
      gameEmoji: game.emoji,
      wins: item.wins,
      losses: item.losses,
      total: item.wins + item.losses,
      winRate: item.winPct,
      balance: 0,
      hasStake: false,
    }
  })

  const wins = disciplineStats.reduce((acc, item) => acc + item.wins, 0)
  const losses = disciplineStats.reduce((acc, item) => acc + item.losses, 0)

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
      totalMatches: row.stats.totalBets,
      winRate: row.stats.winRate,
      balance: row.stats.balance,
      disciplines: disciplineStats.length,
      friends: row.friendsRank.length,
      currentStreak: 0,
      wins,
      losses,
    },
    disciplineStats,
    loading: false,
  }
}

export function useProfile() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<ProfileData | null>(null)

  const load = useCallback(async () => {
    const userId = await AuthService.getCurrentUserId()
    if (!userId) {
      setData(null)
      return
    }
    try {
      const row = await BetsService.getProfileScreenData(userId)
      setData(row ? mapToProfileData(row) : null)
    } catch (e) {
      error('[useProfile] load', e)
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }, [load])

  return { loading, refreshing, data, onRefresh, reload: load }
}
