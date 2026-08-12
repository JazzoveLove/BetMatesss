import { useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/features/auth'
import { queryKeys } from '@/shared/lib/queryKeys'
import { getPairDetail } from '../api'

export function useFriendDetail(friendId: string) {
  
  const { userId } = useAuthContext()

  const { data, isLoading, isRefetching, refetch, error } = useQuery({
    queryKey: queryKeys.friendDetail(userId ?? '', friendId),
    queryFn: () => getPairDetail(userId!, friendId),
    enabled: !!userId && !!friendId,
  })

  useFocusEffect(
    useCallback(() => {
      if (userId && friendId) void refetch()
    }, [userId, friendId, refetch]),
  )

  return {
    loading: isLoading,
    refreshing: isRefetching,
    error,
    friendNick: data?.friendNick ?? '',
    balance: data?.balance ?? 0,
    stats: data?.stats ?? [],
    refresh: refetch,
  }
}