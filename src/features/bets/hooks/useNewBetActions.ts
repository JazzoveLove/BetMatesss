
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
    setSelectedFormat,
    setBestOfCount,
    setStakeMode,
    setStakeAmount,
    setCustomStakes,
    setPokerMode,
    setPokerStack,
    setPokerRebuyStack,
    setStakePerMatch,
    setSearchQuery,
    setSearchFocused,
    currentUser,
    selectedGame,
    selectedFormat,
    bestOfCount,
    stakeMode,
    stakeAmount,
    customStakes,
    pokerMode,
    pokerStack,
    pokerRebuyStack,
    stakePerMatch,
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
    if (!selectedGame || !selectedFormat || !currentUser) return

    const stakeModeToSend: typeof stakeMode =
      stakeMode === 'none' && stakeAmount > 0 ? 'equal' : stakeMode

    log('[handleSubmit] stakeMode before send:', stakeModeToSend)
    log('[handleSubmit] globalStake:', stakeAmount)

    if (stakeModeToSend === 'equal' && (!Number.isFinite(stakeAmount) || stakeAmount <= 0)) {
      const stakeError = new Error('Stawka musi być większa niż 0 PLN')
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

    log('[handleSubmit] stakePerMatch:', stakePerMatch)
    log('[handleSubmit] selectedFormat:', selectedFormat)

    submittingRef.current = true
    setIsSubmitting(true)
    try {
      await createBet({
        creatorId: currentUser.id,
        gameTemplate: selectedGame.id,
        format: selectedFormat,
        stakeMode: stakeModeToSend,
        participants: participantRows,
        globalStake: stakeModeToSend === 'equal' ? stakeAmount : 0,
        bestOfCount: selectedFormat === 'best_of' ? bestOfCount : undefined,
        stakePerMatch: selectedFormat === 'per_match' ? stakePerMatch : undefined,
        stakeAmount: stakeModeToSend === 'equal' ? stakeAmount : undefined,
        customStakes: stakeModeToSend === 'custom' ? customStakes : undefined,
        pokerMode: selectedGame.id === 'poker' ? pokerMode : undefined,
        pokerStack: selectedGame.id === 'poker' ? pokerStack : undefined,
        pokerRebuyStack: selectedGame.id === 'poker' ? pokerRebuyStack : undefined,
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
    bestOfCount,
    createBet,
    currentUser,
    customStakes,
    navigation,
    participants,
    pokerMode,
    pokerRebuyStack,
    pokerStack,
    selectedFormat,
    selectedGame,
    stakeAmount,
    stakeMode,
    stakePerMatch,
  ])

  const resetNewBet = useCallback(() => {
    submittingRef.current = false
    setIsSubmitting(false)
    setStep(1)
    setSelectedGame(null)
    setParticipants([])
    setSelectedFormat(null)
    setBestOfCount(3)
    setStakeMode('equal')
    setStakeAmount(0)
    setStakePerMatch(0)
    setCustomStakes({})
    setPokerMode('winner_takes_all')
    setPokerStack(3000)
    setPokerRebuyStack(1500)
    setSearchQuery('')
    setSearchFocused(false)
  }, [
    setBestOfCount,
    setCustomStakes,
    setIsSubmitting,
    setParticipants,
    setPokerMode,
    setPokerRebuyStack,
    setPokerStack,
    setSearchFocused,
    setSearchQuery,
    setSelectedFormat,
    setSelectedGame,
    setStakeAmount,
    setStakeMode,
    setStakePerMatch,
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
    setSelectedFormat,
    setBestOfCount,
    setStakePerMatch,
    setPokerMode,
    setPokerStack,
    setPokerRebuyStack,
    setStakeMode,
    setStakeAmount,
    setCustomStakes,
    setSearchQuery,
    setSearchFocused: v => setSearchFocused(v),
  }
}
