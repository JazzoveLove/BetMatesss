import { useCallback, useEffect, useState } from 'react'
import { AuthService } from '../services/auth.service'
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

function mapRecentResult(amount: number): 'win' | 'loss' {
  return amount >= 0 ? 'win' : 'loss'
}

function mapGame(gameTemplate: string): string {
  return GAME_MAP[gameTemplate]?.label ?? gameTemplate
}

export function useDashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<DashboardUser>({ nick: '', avatarInitials: '?' })
  const [stats, setStats] = useState<DashboardStats>({
    wins: 0,
    losses: 0,
    winRate: 0,
    totalMatches: 0,
    balance: 0,
  })
  const [activeBets, setActiveBets] = useState<ActiveDashboardBet[]>([])
  const [recentMatches, setRecentMatches] = useState<RecentDashboardMatch[]>([])

  const load = useCallback(async () => {
    const userId = await AuthService.getCurrentUserId()
    if (!userId) {
      setUser({ nick: '', avatarInitials: '?' })
      setStats({ wins: 0, losses: 0, winRate: 0, totalMatches: 0, balance: 0 })
      setActiveBets([])
      setRecentMatches([])
      return
    }

    const data = await BetsService.getDashboardData(userId)
    setUser({ nick: data.nick, avatarInitials: getInitials(data.nick) })
    setStats({
      wins: data.stats.wins,
      losses: data.stats.losses,
      winRate: data.stats.winRate,
      totalMatches: data.stats.totalMatches,
      balance: data.stats.balance,
    })
    setActiveBets(
      data.activeBets.map(item => ({
        id: item.id,
        opponentNick: item.opponentNick,
        opponentInitials: getInitials(item.opponentNick),
        game: mapGame(item.gameTemplate),
        amount: item.stakeAmount,
        timeLabel: item.timeLabel,
        status: mapActiveStatus(item.status),
      })),
    )
    setRecentMatches(
      data.recentResults.map(item => ({
        id: item.id,
        opponentNick: item.opponentNick,
        opponentInitials: getInitials(item.opponentNick),
        game: mapGame(item.gameTemplate),
        amount: item.profit,
        dateLabel: item.timeLabel,
        result: mapRecentResult(item.profit),
      })),
    )
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  return { loading, user, stats, activeBets, recentMatches }
}
