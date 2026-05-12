import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryKeys'
import { BetsService } from '../services/bets.service'
import type { BetStatus, HistoryListItem } from '../types/bet.types'

export type HistoryFilter = 'all' | 'active' | 'completed'

type HistoryQueryResult = {
  items: HistoryListItem[]
  statusById: Map<string, BetStatus>
}

function itemMatchesFilter(item: HistoryListItem, filter: HistoryFilter, statusById: Map<string, BetStatus>): boolean {
  const st = statusById.get(item.id)
  if (!st) return filter === 'all'
  if (filter === 'all') return true
  if (filter === 'completed') return st === 'completed'
  return st !== 'completed'
}

export function useHistory(initialFilter: HistoryFilter = 'all') {
  const { userId } = useAuthContext()
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter)

  const { data, isLoading, isRefetching, refetch } = useQuery<HistoryQueryResult>({
    queryKey: queryKeys.history(userId ?? ''),
    queryFn: async () => {
      const [items, bets] = await Promise.all([
        BetsService.getHistoryForUser(userId!),
        BetsService.getUserBets(userId!),
      ])
      return {
        items,
        statusById: new Map(bets.map(b => [b.id, b.status])),
      }
    },
    enabled: !!userId,
  })

  const filteredItems = useMemo(
    () => (data?.items ?? []).filter(item => itemMatchesFilter(item, filter, data?.statusById ?? new Map())),
    [data, filter],
  )

  return {
    loading: isLoading,
    refreshing: isRefetching,
    items: filteredItems,
    filter,
    setFilter,
    onRefresh: refetch,
    reload: refetch,
  }
}
