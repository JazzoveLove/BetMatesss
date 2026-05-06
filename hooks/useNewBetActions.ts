/** Akcje kreatora nowego zakładu */

import { useCallback } from 'react'
import { Alert } from 'react-native'
import type { GameTemplate } from '../constants/games'
import type { CreateBetParams } from '../types/bet.types'
import type { UserProfile } from '../types/user.types'
import { error, log } from '../utils/logger'
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
    if (!selectedGame || !selectedFormat || !currentUser) return

    // Guard: if user typed an amount but mode was never explicitly changed from 'none', treat as 'equal'
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
