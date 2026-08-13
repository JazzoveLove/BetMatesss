
import { useCallback, useRef, useState } from 'react'
import { Alert } from 'react-native'
import type { GameTemplate } from '@/shared/constants/games'
import type { CreateBetParams } from '@/features/bets/types/bet.types'
import type { UserProfile } from '@/shared/types/user.types'
import { error, log } from '@/shared/utils/logger'
import type { NewBetHandlers, NewBetNavigation, NewBetStep } from './useNewBet.types'
import type { UseNewBetDerivedReturn } from './useNewBetDerived'
import type { UseNewBetStateReturn } from './useNewBetState'

export function useNewBetActions(
  state: UseNewBetStateReturn,
  _derived: UseNewBetDerivedReturn,
  navigation: NewBetNavigation,
  createBet: (params: CreateBetParams) => Promise<unknown>,
): NewBetHandlers {
  const {
    step,
    setStep,
    setSelectedGame,
    participants,
    setParticipants,
    setStakeMode,
    setStakeAmount,
    setCustomStakes,
    setSearchQuery,
    setSearchFocused,
    currentUser,
    selectedGame,
    stakeMode,
    stakeAmount,
    customStakes,
  } = state

  const submittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGameSelect = useCallback((game: GameTemplate) => {
    setSelectedGame(game)
    setStep(2)
  }, [setSelectedGame, setStep])

  const toggleParticipant = useCallback((friend: UserProfile) => {
    setParticipants(prev =>
      prev.some(p => p.id === friend.id) ? prev.filter(p => p.id !== friend.id) : [...prev, friend],
    )
  }, [setParticipants])

  const handleBack = useCallback(() => {
    if (step === 1) {
      Alert.alert('Anulowac?', 'Stracisz wprowadzone dane.', [
        { text: 'Kontynuuj', style: 'cancel' },
        { text: 'Anuluj zaklad', onPress: () => navigation.goBack() },
      ])
      return
    }
    setStep(prev => (prev - 1) as NewBetStep)
  }, [navigation, setStep, step])

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return
    if (!selectedGame || !currentUser) return

    const stakeModeToSend: typeof stakeMode =
      stakeMode === 'none' && stakeAmount > 0 ? 'equal' : stakeMode

    log('[handleSubmit] stakeMode before send:', stakeModeToSend)
    log('[handleSubmit] globalStake:', stakeAmount)

    if (stakeModeToSend === 'equal' && (!Number.isFinite(stakeAmount) || stakeAmount <= 0)) {
      const stakeError = new Error('Stawka musi być większa niż 0 j.')
      error('[useNewBet] handleSubmit validation', stakeError)
      Alert.alert('Błąd', stakeError.message)
      return
    }
    const allParticipants = [currentUser, ...participants]
    const participantRows = allParticipants.map(player => ({
      id: player.id,
      nick: player.nick,
      customStake: stakeModeToSend === 'custom' ? customStakes[player.id] ?? 0 : stakeAmount,
    }))

    submittingRef.current = true
    setIsSubmitting(true)
    try {
      await createBet({
        creatorId: currentUser.id,
        gameTemplate: selectedGame.id,
        format: 'single',
        stakeMode: stakeModeToSend,
        participants: participantRows,
        globalStake: stakeModeToSend === 'equal' ? stakeAmount : 0,
        stakeAmount: stakeModeToSend === 'equal' ? stakeAmount : undefined,
        customStakes: stakeModeToSend === 'custom' ? customStakes : undefined,
        participantIds: participants.map(p => p.id),
      })

      navigation.navigate('Home')
    } catch (e) {
      error('[useNewBet] handleSubmit createBet', e)
      const message = e instanceof Error ? e.message : 'Nie udało się utworzyć zakładu. Spróbuj ponownie.'
      Alert.alert('Błąd', message)
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }, [
    createBet,
    currentUser,
    customStakes,
    navigation,
    participants,
    selectedGame,
    stakeAmount,
    stakeMode,
  ])

  const resetNewBet = useCallback(() => {
    submittingRef.current = false
    setIsSubmitting(false)
    setStep(1)
    setSelectedGame(null)
    setParticipants([])
    setStakeMode('equal')
    setStakeAmount(0)
    setCustomStakes({})
    setSearchQuery('')
    setSearchFocused(false)
  }, [
    setCustomStakes,
    setIsSubmitting,
    setParticipants,
    setSearchFocused,
    setSearchQuery,
    setSelectedGame,
    setStakeAmount,
    setStakeMode,
    setStep,
  ])

  return {
    handleGameSelect,
    handleBack,
    handleSubmit,
    isSubmitting,
    resetNewBet,
    toggleParticipant,
    setParticipants,
    setStep,
    setStakeMode,
    setStakeAmount,
    setCustomStakes,
    setSearchQuery,
    setSearchFocused: v => setSearchFocused(v),
  }
}
