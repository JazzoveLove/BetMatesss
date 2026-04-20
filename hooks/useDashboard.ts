import { useCallback, useEffect, useState } from 'react'
import { AuthService } from '../services/auth.service'
import { BetsService } from '../services/bets.service'
import type { ActiveBetItem, RecentResult, DashboardStats } from '../types/bet.types'

export function useDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [nick, setNick] = useState('')
  const [stats, setStats] = useState<DashboardStats>({ balance: 0, totalBets: 0, winRate: 0 })
  const [activeBets, setActiveBets] = useState<ActiveBetItem[]>([])
  const [recentResults, setRecentResults] = useState<RecentResult[]>([])

  const load = useCallback(async () => {
    const userId = await AuthService.getCurrentUserId()
    if (!userId) return
    const data = await BetsService.getDashboardData(userId)
    setNick(data.nick)
    setStats(data.stats)
    setActiveBets(data.activeBets)
    setRecentResults(data.recentResults)
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  return { loading, refreshing, nick, stats, activeBets, recentResults, onRefresh }
}
