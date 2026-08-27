import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/features/auth'
import { queryKeys } from '@/shared/lib/queryKeys'
import { getBalancesScreenData } from '@/features/balances/api/balances.queries'
import { getBalanceCounts, getBalanceSummary, getVisibleBalances } from '@/features/balances/utils/balanceLogic'
import type { BalanceFilter } from '@/features/balances/types/balance.types'

export function useBalances() {
  const { userId } = useAuthContext()
  const [filter, setFilter] = useState<BalanceFilter>('all')

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: queryKeys.balances(userId ?? ''),
    queryFn: () => getBalancesScreenData(userId!),
    enabled: !!userId,
  })

  useFocusEffect(
    useCallback(() => {
      if (userId) void refetch()
    }, [userId, refetch]),
  )

  const allRows = data ?? []

  const items = useMemo(() => getVisibleBalances(allRows, filter), [allRows, filter])
  const counts = useMemo(() => getBalanceCounts(allRows), [allRows])
  const summary = useMemo(() => getBalanceSummary(allRows, filter), [allRows, filter])

  return {
    loading: isLoading,
    refreshing: isRefetching,
    hasAnyFriends: allRows.length > 0,
    items,
    counts,
    summary,
    filter,
    setFilter,
    onRefresh: refetch,
  }
}
