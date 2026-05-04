import { useCallback, useEffect, useState } from 'react'
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
import { NotificationsService, type BetInviteNotification } from '../services/notifications.service'
import { BetsService } from '../services/bets.service'
import { error, log } from '../utils/logger'

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
  const { userId } = useAuthContext()
  const me = userId
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [myInviteCode, setMyInviteCode] = useState<string | null>(null)
  const [incoming, setIncoming] = useState<Friendship[]>([])
  const [outgoing, setOutgoing] = useState<Friendship[]>([])
  const [friends, setFriends] = useState<Friendship[]>([])
  const [nickById, setNickById] = useState<Record<string, string>>({})
  const [avatarById, setAvatarById] = useState<Record<string, string | null>>({})
  const [betInvites, setBetInvites] = useState<BetInviteNotification[]>([])

  const reload = useCallback(async () => {
    if (!userId) return
    try {
      const data = await loadFriendships(userId)
      setIncoming(data.incoming)
      setOutgoing(data.outgoing)
      setFriends(data.friends)
      setNickById(data.nickById)
      setAvatarById(data.avatarById)
      const invites = await NotificationsService.getPendingBetInviteNotifications(userId)
      setBetInvites(invites)
    } catch (err) {
      log('useFriends reload error:', err)
    }
  }, [userId])

  const reloadWithCode = useCallback(async () => {
    try {
      await reload()
      if (userId) {
        const code = await ensureMyInviteCode(userId)
        setMyInviteCode(code)
      }
    } catch (e) {
      error('[useFriends] reloadWithCode', e)
    }
  }, [reload, userId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await reloadWithCode()
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [reloadWithCode])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await reloadWithCode()
    } finally {
      setRefreshing(false)
    }
  }, [reloadWithCode])

  useEffect(() => {
    if (!me) return
    return subscribeFriendshipChanges(me, reload)
  }, [me, reload])

  const handleInviteFromLink = useCallback(
    async (otherId: string) => {
      if (!userId) return
      try {
        const result = await handleFriendInvite(userId, otherId)
        alertForInviteResult(result, reload)
      } catch (e) {
        error('[useFriends] handleInviteFromLink', e)
        Alert.alert('Błąd', 'Nie udało się przetworzyć zaproszenia.')
      }
    },
    [reload, userId],
  )

  const processInviteQueue = useCallback(() => {
    const ids = drainFriendInvites()
    for (const id of ids) void handleInviteFromLink(id)
  }, [handleInviteFromLink])

  useFocusEffect(
    useCallback(() => {
      processInviteQueue()
      void reload()
    }, [processInviteQueue, reload]),
  )

  useEffect(() => {
    return subscribeFriendInvites(processInviteQueue)
  }, [processInviteQueue])

  const accept = useCallback(
    async (row: Friendship) => {
      const result = await acceptFriendship(row.id)
      if (result.error) Alert.alert('Błąd', result.error)
      else await reload()
    },
    [reload],
  )

  const reject = useCallback(
    async (row: Friendship) => {
      const result = await rejectFriendship(row.id)
      if (result.error) Alert.alert('Błąd', result.error)
      else await reload()
    },
    [reload],
  )

  const nick = useCallback((id: string) => nickById[id] ?? '…', [nickById])
  const avatar = useCallback((id: string) => avatarById[id] ?? null, [avatarById])

  const acceptBetInvite = useCallback(
    async (invite: BetInviteNotification) => {
      if (!userId) return
      try {
        const result = await BetsService.confirmParticipation(invite.betId, userId)
        if (result.error) {
          Alert.alert('Błąd', result.error)
          return
        }
        await NotificationsService.markNotificationRead(invite.id)
        await reload()
        Alert.alert('Dołączono', 'Zaproszenie do zakładu zostało zaakceptowane.')
      } catch (e) {
        error('[useFriends] acceptBetInvite', e)
        Alert.alert('Błąd', 'Nie udało się zaakceptować zaproszenia do zakładu.')
      }
    },
    [reload, userId],
  )

  const rejectBetInvite = useCallback(
    async (invite: BetInviteNotification) => {
      if (!userId) return
      try {
        const result = await BetsService.rejectParticipation(invite.betId, userId)
        if (result.error) {
          Alert.alert('Błąd', result.error)
          return
        }
        await NotificationsService.markNotificationRead(invite.id)
        await reload()
        Alert.alert('Odrzucono', 'Zaproszenie do zakładu zostało odrzucone.')
      } catch (e) {
        error('[useFriends] rejectBetInvite', e)
        Alert.alert('Błąd', 'Nie udało się odrzucić zaproszenia do zakładu.')
      }
    },
    [reload, userId],
  )

  return {
    loading,
    refreshing,
    me,
    myInviteCode,
    incoming,
    outgoing,
    friends,
    nick,
    avatar,
    betInvites,
    onRefresh,
    accept,
    reject,
    handleInviteFromLink,
    acceptBetInvite,
    rejectBetInvite,
  }
}
