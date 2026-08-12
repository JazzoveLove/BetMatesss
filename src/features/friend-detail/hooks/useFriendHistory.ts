import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/features/auth'
import { queryKeys } from '@/shared/lib/queryKeys'
import { getHistoryForPair } from '../api'
import type { HistoryFilter } from '@/features/bets/hooks/useHistory'

export function useFriendHistory(friendId: string) {
  const { userId } = useAuthContext()
  const [filter, setFilter] = useState<HistoryFilter>('all')

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: queryKeys.friendHistory(userId ?? '', friendId),
    queryFn: () => getHistoryForPair(userId!, friendId),
    enabled: !!userId && !!friendId,
  })

  useFocusEffect(
    useCallback(() => {
      if (userId && friendId) void refetch()
    }, [userId, friendId, refetch]),
  )

  const items = data ?? []

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'completed') return items.filter(i => i.badge === 'wygrany' || i.badge === 'przegrany' || i.badge === 'zakończony')
    return items.filter(i => i.badge === 'aktywny' || i.badge === 'oczekuje')
  }, [items, filter])

  return {
    loading: isLoading,
    refreshing: isRefetching,
    items: filteredItems,
    filter,
    setFilter,
    refresh: refetch,
  }
}