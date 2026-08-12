
import { useCallback } from 'react'
import { Alert } from 'react-native'
import { BetsService } from '@/features/bets/api'
import type { BetDetail, PendingResult } from '@/features/bets/types/bet.types'
import { error } from '@/shared/utils/logger'
import type { ActionLoadingState } from './useBetDetailData'

export function useBetDetailActions(
  betId: string,
  bet: BetDetail | null,
  currentUserId: string | null,
  pendingResult: PendingResult | null,
  score: string,
  setScore: (s: string) => void,
  setAction: (key: keyof ActionLoadingState, value: ActionLoadingState[keyof ActionLoadingState]) => void,
  loadData: () => Promise<void>,
) {
  const submitResult = useCallback(
    async (winnerId: string, scoreOverride?: string): Promise<boolean> => {
      if (!bet || !currentUserId) return false
      const resultScore = (scoreOverride ?? score).trim()
      if (!resultScore) {
        Alert.alert('Brak wyniku', 'Wpisz wynik przed rozstrzygnięciem.')
        return false
      }
      setAction('resolving', true)
      try {
        const result = await BetsService.submitBetResult({
          betId,
          winnerId,
          score: resultScore,
          recordedBy: currentUserId,
        })
        if (result.error) {
          Alert.alert('Błąd', result.error)
          return false
        }
        setScore(resultScore)
        await loadData()
        return true
      } catch (e) {
        error('[useBetDetail] submitResult', e)
        Alert.alert('Błąd', 'Nie udało się zapisać wyniku.')
        return false
      } finally {
        setAction('resolving', false)
      }
    },
    [bet, currentUserId, score, betId, loadData, setAction],
  )

  const submitPerMatchResult = useCallback(
    async (winnerId: string, scoreText: string, requireScore: boolean): Promise<boolean> => {
      if (!bet || !currentUserId) return false
      const trimmed = scoreText.trim()
      if (requireScore && !trimmed) {
        Alert.alert('Brak wyniku', 'Wpisz wynik meczu.')
        return false
      }
      setAction('resolving', true)
      try {
        const result = await BetsService.submitPerMatchBetResult({
          betId,
          winnerId,
          score: trimmed,
          recordedBy: currentUserId,
        })
        if (result.error) {
          Alert.alert('Błąd', result.error)
          return false
        }
        await loadData()
        return true
      } catch (e) {
        error('[useBetDetail] submitPerMatchResult', e)
        Alert.alert('Błąd', 'Nie udało się zapisać wyniku meczu.')
        return false
      } finally {
        setAction('resolving', false)
      }
    },
    [bet, currentUserId, betId, loadData, setAction],
  )

  const completeMatchSession = useCallback(async (): Promise<boolean> => {
    if (!currentUserId) return false
    setAction('completingSession', true)
    try {
      const result = await BetsService.completePerMatchSession(betId, currentUserId)
      if (result.error) {
        Alert.alert('Błąd', result.error)
        return false
      }
      await loadData()
      return true
    } catch (e) {
      error('[useBetDetail] completeMatchSession', e)
      Alert.alert('Błąd', 'Nie udało się zakończyć sesji.')
      return false
    } finally {
      setAction('completingSession', false)
    }
  }, [betId, currentUserId, loadData, setAction])

  const confirmResult = useCallback(async () => {
    if (!bet || !currentUserId || !pendingResult) return
    setAction('confirming', true)
    try {
      const result = await BetsService.confirmBetResult({
        betId,
        resultId: pendingResult.id,
        confirmerId: currentUserId,
      })
      if (result.error) {
        Alert.alert('Błąd', result.error)
        return
      }
      await loadData()
    } catch (e) {
      error('[useBetDetail] confirmResult', e)
      Alert.alert('Błąd', 'Nie udało się potwierdzić wyniku.')
    } finally {
      setAction('confirming', false)
    }
  }, [bet, betId, currentUserId, pendingResult, loadData, setAction])

  const disputeResult = useCallback(async () => {
    if (!pendingResult) return
    setAction('disputing', true)
    try {
      const result = await BetsService.disputeBetResult(betId)
      if (result.error) {
        Alert.alert('Błąd', result.error)
        return
      }
      await loadData()
    } catch (e) {
      error('[useBetDetail] disputeResult', e)
      Alert.alert('Błąd', 'Nie udało się zakwestionować wyniku.')
    } finally {
      setAction('disputing', false)
    }
  }, [betId, pendingResult, loadData, setAction])

  const cancelBet = useCallback(async (): Promise<boolean> => {
    setAction('cancelling', true)
    try {
      const result = await BetsService.cancelDisputedBet(betId)
      if (result.error) {
        Alert.alert('Błąd', result.error)
        return false
      }
      await loadData()
      return true
    } catch (e) {
      error('[useBetDetail] cancelBet', e)
      Alert.alert('Błąd', 'Nie udało się anulować zakładu.')
      return false
    } finally {
      setAction('cancelling', false)
    }
  }, [betId, loadData, setAction])

  const acceptBet = useCallback(async (): Promise<boolean> => {
    if (!currentUserId) return false
    setAction('accepting', true)
    try {
      const result = await BetsService.confirmParticipation(betId, currentUserId)
      if (result.error) {
        Alert.alert('Błąd', result.error)
        return false
      }
      await loadData()
      return true
    } catch (e) {
      error('[useBetDetail] acceptBet', e)
      Alert.alert('Błąd', 'Nie udało się dołączyć do zakładu.')
      return false
    } finally {
      setAction('accepting', false)
    }
  }, [betId, currentUserId, loadData, setAction])

  const rejectBet = useCallback(async (): Promise<boolean> => {
    if (!currentUserId) return false
    setAction('rejecting', true)
    try {
      const result = await BetsService.rejectParticipation(betId, currentUserId)
      if (result.error) {
        Alert.alert('Błąd', result.error)
        return false
      }
      await loadData()
      Alert.alert('Zakład odrzucony', 'Zakład został odrzucony.')
      return true
    } catch (e) {
      error('[useBetDetail] rejectBet', e)
      Alert.alert('Błąd', 'Nie udało się odrzucić zakładu.')
      return false
    } finally {
      setAction('rejecting', false)
    }
  }, [betId, currentUserId, loadData, setAction])

  return {
    submitResult,
    submitPerMatchResult,
    completeMatchSession,
    confirmResult,
    disputeResult,
    cancelBet,
    acceptBet,
    rejectBet,
  }
}

// za dlugi ten plik cbyba
