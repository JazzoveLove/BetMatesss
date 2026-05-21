import { useCallback, useEffect } from 'react'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import { Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useAuthContext } from '../contexts/AuthContext'
import {
  loadFriendships,
  ensureMyInviteCode,
  acceptFriendship,
  rejectFriendship,
  handleFriendInvite,
  subscribeFriendshipChanges,
} from '../services/friends.service'
import {
  drainFriendInvites,
  subscribeFriendInvites,
} from '../lib/friend-invite-queue'
import type { Friendship } from '../types/user.types'
import { error, log } from '../utils/logger'
import { queryKeys } from '../lib/queryKeys'

function alertForInviteResult(
  result: Awaited<ReturnType<typeof handleFriendInvite>>,
  reload: () => void,
) {
  switch (result.type) {
    case 'self':
      Alert.alert('To Ty', 'Nie możesz dodać samego siebie.')
      break
    case 'missing_function':
      Alert.alert(
        'Baza danych',
        'Uruchom w Supabase skrypt z pliku supabase/users_invite_code.sql.',
      )
      break
    case 'not_found':
      Alert.alert('Nie znaleziono', 'Ten link jest nieprawidłowy albo ta osoba nie dokończyła profilu.')
      break
    case 'already_friends':
      Alert.alert('Już znajomi', 'Ta osoba jest już na liście znajomych.')
      reload()
      break
    case 'already_sent':
      Alert.alert('Wysłano', 'Zaproszenie już czeka na akceptację.')
      reload()
      break
    case 'accepted':
      Alert.alert('Gotowe', 'Jesteście teraz znajomymi.')
      reload()
      break
    case 'sent':
      Alert.alert('Wysłano', 'Zaproszenie zostało wysłane.')
      reload()
      break
    case 'duplicate':
      Alert.alert('Już istnieje', 'Taka relacja jest już zapisana.')
      break
    case 'error':
      Alert.alert('Błąd', result.message)
      break
  }
}

export function useFriends() {
  const queryClient = useQueryClient()
  const { userId} = useAuthContext()
  const me = userId

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.friends(userId ?? ''),
    queryFn: () => loadFriendships(userId!),
    enabled: !!userId,
  })

  const onRefresh = useCallback(async () => {
    if (!userId) return
    try {
      await refetch()
    } catch (err) {
      error('[useFriends] onRefresh', err)
    }
  }, [userId, refetch])

  useEffect(() => {
    if (!me) return
    return subscribeFriendshipChanges(me, () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.friends(me) })
    )
  }, [me, queryClient])

  const handleInviteFromLink = useCallback(
    async (otherId: string) => {
      if (!userId) return
      try {
        const result = await handleFriendInvite(userId, otherId)
        alertForInviteResult(result, refetch)
      } catch (e) {
        error('[useFriends] handleInviteFromLink', e)
        Alert.alert('Błąd', 'Nie udało się przetworzyć zaproszenia.')
      }
    },
    [refetch, userId],
  )

  const processInviteQueue = useCallback(() => {
    const ids = drainFriendInvites()
    for (const id of ids) void handleInviteFromLink(id)
  }, [handleInviteFromLink])

  useFocusEffect(
    useCallback(() => {
      processInviteQueue()
      void refetch()
    }, [processInviteQueue, refetch]),
  )

  useEffect(() => {
    return subscribeFriendInvites(processInviteQueue)
  }, [processInviteQueue])

  const acceptMutation = useMutation({
    mutationFn: async (row: Friendship) => {
      const result = await acceptFriendship(row.id)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends(userId!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId!) })
    },
    onError: (err: Error) => {
      Alert.alert('Błąd', err.message)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (row: Friendship) => {
      const result = await rejectFriendship(row.id)
      if (result.error) throw new Error(result.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends(userId!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId!) })
    },
    onError: (err: Error) => {
      Alert.alert('Błąd', err.message)
    },
  })

  return {
    loading: isLoading,
    refreshing: isRefetching,
    me,
    myInviteCode: ensureMyInviteCode(userId!) ?? null,
    incoming: data?.incoming ?? [],
    outgoing: data?.outgoing ?? [],
    friends: data?.friends ?? [],
    nickById: data?.nickById ?? {},
    avatarById: data?.avatarById ?? {},
    onRefresh,
    accept: (row: Friendship) => acceptMutation.mutate(row),
    reject: (row: Friendship) => rejectMutation.mutate(row),
    handleInviteFromLink,
  }
}
