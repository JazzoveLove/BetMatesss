import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { BetsService } from '../services/bets.service'
import type { BetStatus, HistoryListItem } from '../types/bet.types'
import { log } from '../utils/logger'

export type HistoryFilter = 'all' | 'active' | 'completed'

function itemMatchesFilter(item: HistoryListItem, filter: HistoryFilter, statusById: Map<string, BetStatus>): boolean {
  const st = statusById.get(item.id)
  if (!st) return filter === 'all'
  if (filter === 'all') return true
  if (filter === 'completed') return st === 'completed'
  return st !== 'completed'
}

export function useHistory(initialFilter: HistoryFilter = 'all') {
  const { userId } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [items, setItems] = useState<HistoryListItem[]>([])
  const [statusById, setStatusById] = useState<Map<string, BetStatus>>(new Map())
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter)

  const load = useCallback(async () => {
    if (!userId) {
      setItems([])
      setStatusById(new Map())
      return
    }
    try {
      const [list, bets] = await Promise.all([
        BetsService.getHistoryForUser(userId),
        BetsService.getUserBets(userId),
      ])
      setItems(list)
      setStatusById(new Map(bets.map(b => [b.id, b.status])))
    } catch (err) {
      log('useHistory load error:', err)
    }
  }, [userId])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await load()
    } catch (err) {
      log('useHistory onRefresh error:', err)
    } finally {
      setRefreshing(false)
    }
  }, [load])

  const filteredItems = useMemo(
    () => items.filter(item => itemMatchesFilter(item, filter, statusById)),
    [items, filter, statusById],
  )

  return {
    loading,
    refreshing,
    items: filteredItems,
    filter,
    setFilter,
    onRefresh,
    reload: load,
  }
}
