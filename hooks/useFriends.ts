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
import type { FriendshipRow } from '../types/user.types'
import { NotificationsService, type BetInviteNotification } from '../services/notifications.service'
import { BetsService } from '../services/bets.service'

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
  const [incoming, setIncoming] = useState<FriendshipRow[]>([])
  const [outgoing, setOutgoing] = useState<FriendshipRow[]>([])
  const [friends, setFriends] = useState<FriendshipRow[]>([])
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
    const data = await loadFriendships(userId)
    setIncoming(data.incoming)
    setOutgoing(data.outgoing)
    setFriends(data.friends)
    setNickById(data.nickById)
    setAvatarById(data.avatarById)
    const invites = await NotificationsService.getPendingBetInviteNotifications(userId)
    setBetInvites(invites)
  }, [])

  const reloadWithCode = useCallback(async () => {
    await reload()
    const userId = await AuthService.getCurrentUserId()
    if (userId) {
      const code = await ensureMyInviteCode(userId)
      setMyInviteCode(code)
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
    await reloadWithCode()
    setRefreshing(false)
  }, [reloadWithCode])

  // Realtime
  useEffect(() => {
    if (!me) return
    return subscribeFriendshipChanges(me, reload)
  }, [me, reload])

  // Invite queue processing
  const handleInviteFromLink = useCallback(
    async (otherId: string) => {
      const userId = await AuthService.getCurrentUserId()
      if (!userId) return
      const result = await handleFriendInvite(userId, otherId)
      alertForInviteResult(result, reload)
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

  useEffect(() => subscribeFriendInvites(processInviteQueue), [processInviteQueue])

  // Actions
  const accept = useCallback(
    async (row: FriendshipRow) => {
      const result = await acceptFriendship(row.id)
      if (result.error) Alert.alert('Błąd', result.error)
      else await reload()
    },
    [reload],
  )

  const reject = useCallback(
    async (row: FriendshipRow) => {
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
    const result = await lookupUserByCode(raw)
    setSendingCode(false)
    if ('error' in result) {
      if ((result as any).missingFunction) {
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
    const results = await searchUsersByNick(text, userId ?? '')
    setSearchingNick(false)
    setNickResults(results)
  }, [])

  const nick = useCallback((id: string) => nickById[id] ?? '…', [nickById])
  const avatar = useCallback((id: string) => avatarById[id] ?? null, [avatarById])

  const acceptBetInvite = useCallback(
    async (invite: BetInviteNotification) => {
      const userId = await AuthService.getCurrentUserId()
      if (!userId) return
      const result = await BetsService.confirmParticipation(invite.betId, userId)
      if (result.error) {
        Alert.alert('Błąd', result.error)
        return
      }
      await NotificationsService.markNotificationRead(invite.id)
      await reload()
      Alert.alert('Dołączono', 'Zaproszenie do zakładu zostało zaakceptowane.')
    },
    [reload],
  )

  const rejectBetInvite = useCallback(
    async (invite: BetInviteNotification) => {
      const userId = await AuthService.getCurrentUserId()
      if (!userId) return
      const result = await BetsService.rejectParticipation(invite.betId, userId)
      if (result.error) {
        Alert.alert('Błąd', result.error)
        return
      }
      await NotificationsService.markNotificationRead(invite.id)
      await reload()
      Alert.alert('Odrzucono', 'Zaproszenie do zakładu zostało odrzucone.')
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
