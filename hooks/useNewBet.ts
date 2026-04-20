import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import { AuthService } from '../services/auth.service'
import { BetsService } from '../services/bets.service'
import { getAcceptedFriendsList } from '../services/friends.service'
import { NotificationsService } from '../services/notifications.service'
import type { StakeMode, NewBetParticipant } from '../types/bet.types'
import { parseStakeAmount, toStakeNumber } from '../utils/odds'

export function useNewBet(onCreated: (betId: string) => void) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)
  const [stakeMode, setStakeMode] = useState<StakeMode>('equal')
  const [globalStake, setGlobalStake] = useState('')
  const [participants, setParticipants] = useState<NewBetParticipant[]>([])
  const [currentUser, setCurrentUser] = useState<NewBetParticipant | null>(null)
  const [createdBetId, setCreatedBetId] = useState<string | null>(null)
  const [friends, setFriends] = useState<{ id: string; nick: string; avatar_url?: string | null }[]>([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (step !== 3 || currentUser) return
    ;(async () => {
      const profile = await AuthService.getCurrentUserProfile()
      if (!profile) return
      const me: NewBetParticipant = { id: profile.id, nick: profile.nick, customStake: '' }
      setCurrentUser(me)
      setParticipants([me])
    })()
  }, [step, currentUser])

  useEffect(() => {
    if (step !== 3 || !currentUser) return
    ;(async () => {
      setFriendsLoading(true)
      const rows = await getAcceptedFriendsList(currentUser.id)
      setFriends(rows)
      setFriendsLoading(false)
    })()
  }, [step, currentUser])

  const addParticipant = useCallback((user: { id: string; nick: string }) => {
    setParticipants(prev => {
      if (prev.some(p => p.id === user.id)) return prev
      return [...prev, { ...user, customStake: '' }]
    })
  }, [])

  const removeParticipant = useCallback(
    (id: string) => {
      if (id === currentUser?.id) return
      setParticipants(prev => prev.filter(p => p.id !== id))
    },
    [currentUser],
  )

  const setCustomStake = useCallback((id: string, value: string) => {
    setParticipants(prev => prev.map(p => (p.id === id ? { ...p, customStake: value } : p)))
  }, [])

  const setStakeModeAndReset = useCallback((mode: StakeMode) => {
    if (mode === 'none') setGlobalStake('')
    setStakeMode(mode)
  }, [])

  const canProceedStep1 = selectedGame !== null
  const canProceedStep2 = selectedFormat !== null
  const canCreate = (() => {
    if (participants.length < 1) return false
    if (stakeMode === 'none') return true
    if (stakeMode === 'custom') return participants.every(p => parseStakeAmount(p.customStake) > 0)
    return parseStakeAmount(globalStake) > 0
  })()

  const totalPool =
    stakeMode === 'custom'
      ? participants.reduce((s, p) => s + parseStakeAmount(p.customStake), 0)
      : parseStakeAmount(globalStake) * participants.length

  const reset = useCallback(() => {
    setStep(1)
    setSelectedGame(null)
    setSelectedFormat(null)
    setStakeMode('equal')
    setGlobalStake('')
    setParticipants([])
    setCurrentUser(null)
    setCreatedBetId(null)
  }, [])

  const ensureBetCreated = useCallback(async (): Promise<string | null> => {
    const profile = currentUser
    if (!profile || !selectedGame || !selectedFormat) return null
    if (createdBetId) return createdBetId
    setSaving(true)
    const globalStakeNum = toStakeNumber(globalStake)
    console.log('[useNewBet ensureBetCreated] payload before createBet', {
      stakeMode,
      globalStakeRaw: globalStake,
      globalStakeNum,
      participants: participants.map(p => ({
        id: p.id,
        nick: p.nick,
        customStake: p.customStake,
        parsedStake: toStakeNumber(p.customStake),
      })),
    })
    const result = await BetsService.createBet({
      creatorId: profile.id,
      gameTemplate: selectedGame,
      format: selectedFormat,
      stakeMode,
      participants,
      globalStake: globalStakeNum,
    })
    setSaving(false)
    if ('error' in result) {
      Alert.alert('Błąd', result.error)
      return null
    }
    setCreatedBetId(result.betId)
    return result.betId
  }, [currentUser, selectedGame, selectedFormat, stakeMode, participants, globalStake, createdBetId])

  const handleCreate = useCallback(async () => {
    const betId = await ensureBetCreated()
    if (!betId) return
    reset()
    onCreated(betId)
  }, [ensureBetCreated, reset, onCreated])

  const inviteFriendToBet = useCallback(
    async (friend: { id: string; nick: string; avatar_url?: string | null }): Promise<{ error?: string }> => {
      const me = currentUser
      if (!me || !selectedGame || !selectedFormat) return { error: 'Brak danych zakładu.' }
      const alreadySelected = participants.some(p => p.id === friend.id)
      if (alreadySelected) return {}

      const betId = await ensureBetCreated()
      if (!betId) return { error: 'Nie udało się utworzyć zakładu.' }

      // W trybie „custom” wcześniej zawsze wstawiano 0 — nowy uczestnik dostaje domyślnie
      // tę samą stawkę co twórca (z kroku 3); dopóki nie ma osobnego pola przy zaproszeniu.
      const friendStake =
        stakeMode === 'none'
          ? 0
          : stakeMode === 'custom'
          ? toStakeNumber(me.customStake)
          : parseStakeAmount(globalStake)

      const addResult = await BetsService.addParticipant(betId, friend.id, friendStake)
      if (addResult.error) return { error: addResult.error }
      addParticipant(friend)
      if (stakeMode === 'custom' && friendStake > 0) {
        setCustomStake(friend.id, String(friendStake))
      }

      const pushResult = await NotificationsService.sendBetInviteNotification({
        userId: friend.id,
        fromUserId: me.id,
        fromNick: me.nick,
        betId,
        gameTemplate: selectedGame,
        stakeAmount: friendStake,
      })

      if (pushResult.error) return { error: pushResult.error }
      return {}
    },
    [
      currentUser,
      selectedGame,
      selectedFormat,
      participants,
      ensureBetCreated,
      stakeMode,
      globalStake,
      addParticipant,
      setCustomStake,
    ],
  )

  return {
    // step
    step,
    setStep,
    // selections
    selectedGame,
    setSelectedGame,
    selectedFormat,
    setSelectedFormat,
    // stakes
    stakeMode,
    setStakeMode: setStakeModeAndReset,
    globalStake,
    setGlobalStake,
    // participants
    participants,
    currentUser,
    createdBetId,
    friends,
    friendsLoading,
    addParticipant,
    removeParticipant,
    setCustomStake,
    // computed
    totalPool,
    canProceedStep1,
    canProceedStep2,
    canCreate,
    // actions
    saving,
    ensureBetCreated,
    inviteFriendToBet,
    handleCreate,
  }
}
