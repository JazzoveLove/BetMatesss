import { useCallback, useMemo } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/features/auth'
import { queryKeys } from '@/shared/lib/queryKeys'
import { getPendingActions } from '@/features/actions/api/actions.pending'
import type { PendingAction, PendingActionCounts } from '@/features/actions/types/action.types'

const EMPTY_COUNTS: PendingActionCounts = { total: 0, bet_invite: 0, result_confirm: 0, dispute: 0 }

export function usePendingActions() {
  const { userId } = useAuthContext()

  const { data, isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: queryKeys.pendingActions(userId ?? ''),
    queryFn: () => getPendingActions(userId!),
    enabled: !!userId,
  })

  useFocusEffect(
    useCallback(() => {
      if (userId) void refetch()
    }, [userId, refetch]),
  )

  const items: PendingAction[] = data ?? []

  // Liczniki per kind — do nagłówków sekcji w 3b. Liczone z data (nie z items),
  // żeby były spójne z tym, co faktycznie wróciło.
  const counts = useMemo<PendingActionCounts>(() => {
    if (!data) return EMPTY_COUNTS
    return data.reduce<PendingActionCounts>(
      (acc, action) => {
        acc.total += 1
        acc[action.kind] += 1
        return acc
      },
      { total: 0, bet_invite: 0, result_confirm: 0, dispute: 0 },
    )
  }, [data])

  return {
    loading: isLoading,
    refreshing: isRefetching,
    // Fail-closed: przy błędzie RPC zgłaszamy isError. items jest wtedy []
    // (brak data), ale konsument MUSI patrzeć na isError — pusta lista bez
    // błędu i pusta lista przy błędzie to dwa różne stany.
    isError,
    items,
    counts,
    onRefresh: refetch,
  }
}
