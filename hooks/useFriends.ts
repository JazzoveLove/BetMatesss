import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { AuthService } from '../services/auth.service'
import {
  loadFriendships,
  ensureMyInviteCode,
  acceptFriendship,
  rejectFriendship,
  handleFriendInvite,
  lookupUserByCode,
  searchUsersByNick,
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
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [me, setMe] = useState<string | null>(null)
  const [myInviteCode, setMyInviteCode] = useState<string | null>(null)
  const [incoming, setIncoming] = useState<Friendship[]>([])
  const [outgoing, setOutgoing] = useState<Friendship[]>([])
  const [friends, setFriends] = useState<Friendship[]>([])
  const [nickById, setNickById] = useState<Record<string, string>>({})
  const [avatarById, setAvatarById] = useState<Record<string, string | null>>({})
  const [codeInput, setCodeInput] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [nickSearch, setNickSearch] = useState('')
  const [nickResults, setNickResults] = useState<{ id: string; nick: string }[]>([])
  const [searchingNick, setSearchingNick] = useState(false)
  const [betInvites, setBetInvites] = useState<BetInviteNotification[]>([])

  const reload = useCallback(async () => {
    const userId = await AuthService.getCurrentUserId()
    if (!userId) return
    setMe(userId)
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
  }, [])

  const reloadWithCode = useCallback(async () => {
    try {
      await reload()
      const userId = await AuthService.getCurrentUserId()
      if (userId) {
        const code = await ensureMyInviteCode(userId)
        setMyInviteCode(code)
      }
    } catch (e) {
      error('[useFriends] reloadWithCode', e)
    }
  }, [reload])

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
      const userId = await AuthService.getCurrentUserId()
      if (!userId) return
      try {
        const result = await handleFriendInvite(userId, otherId)
        alertForInviteResult(result, reload)
      } catch (e) {
        error('[useFriends] handleInviteFromLink', e)
        Alert.alert('Błąd', 'Nie udało się przetworzyć zaproszenia.')
      }
    },
    [reload],
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

  const submitCode = useCallback(async () => {
    const raw = codeInput.trim()
    if (raw.length < 4) {
      Alert.alert('Kod', 'Wpisz co najmniej 4 znaki.')
      return
    }
    setSendingCode(true)
    let result: Awaited<ReturnType<typeof lookupUserByCode>>
    try {
      result = await lookupUserByCode(raw)
    } catch (e) {
      error('[useFriends] submitCode lookupUserByCode', e)
      Alert.alert('Błąd', 'Nie udało się sprawdzić kodu.')
      return
    } finally {
      setSendingCode(false)
    }
    if ('error' in result) {
      if ((result as { missingFunction?: boolean }).missingFunction) {
        Alert.alert('Brak funkcji w bazie', 'Uruchom skrypt supabase/users_invite_code.sql.')
      } else if (result.error === 'not_found') {
        Alert.alert('Nie znaleziono', 'Nie ma takiego kodu.')
      } else {
        Alert.alert('Błąd', result.error)
      }
      return
    }
    setCodeInput('')
    await handleInviteFromLink(result.userId)
  }, [codeInput, handleInviteFromLink])

  const searchNick = useCallback(async (text: string) => {
    setNickSearch(text)
    if (text.trim().length < 2) {
      setNickResults([])
      return
    }
    setSearchingNick(true)
    const userId = await AuthService.getCurrentUserId()
    try {
      const results = await searchUsersByNick(text, userId ?? '')
      setNickResults(results)
    } catch (err) {
      log('searchNick error:', err)
    } finally {
      setSearchingNick(false)
    }
  }, [])

  const nick = useCallback((id: string) => nickById[id] ?? '…', [nickById])
  const avatar = useCallback((id: string) => avatarById[id] ?? null, [avatarById])

  const acceptBetInvite = useCallback(
    async (invite: BetInviteNotification) => {
      const userId = await AuthService.getCurrentUserId()
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
    [reload],
  )

  const rejectBetInvite = useCallback(
    async (invite: BetInviteNotification) => {
      const userId = await AuthService.getCurrentUserId()
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
    [reload],
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
    codeInput,
    setCodeInput,
    sendingCode,
    nickSearch,
    nickResults,
    searchingNick,
    betInvites,
    onRefresh,
    accept,
    reject,
    submitCode,
    searchNick,
    handleInviteFromLink,
    acceptBetInvite,
    rejectBetInvite,
  }
}
