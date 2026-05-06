/** Akcje użytkownika dla szczegółów zakładu */

import { useCallback } from 'react'
import { Alert } from 'react-native'
import { BetsService } from '../services/bets.service'
import { NotificationsService } from '../services/notifications.service'
import type { BetDetail, PendingResult, Settlement } from '../types/bet.types'
import { error, log } from '../utils/logger'
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
  setSettlements: (settlements: Settlement[]) => void,
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
    log('[useBetDetail confirmResult] start', { betId, resultId: pendingResult.id })
    setAction('confirming', true)
    try {
      const result = await BetsService.confirmBetResult({
        betId,
        resultId: pendingResult.id,
        confirmerId: currentUserId,
      })
      log('[useBetDetail confirmResult] BetsService.confirmBetResult', result)
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

  const markPaid = useCallback(
    async (settlementId: string, debtorId: string) => {
      if (!currentUserId || debtorId !== currentUserId) {
        log('[useBetDetail markPaid] skip — not debtor', { settlementId, debtorId, currentUserId })
        return
      }
      log('[useBetDetail markPaid] start', { settlementId, debtorId })
      setAction('markingPaid', settlementId)
      try {
        const result = await BetsService.markAsPaid(settlementId, debtorId)
        log('[useBetDetail markPaid] result', result)
        if (result.error) {
          Alert.alert('Błąd', result.error)
          return
        }
        const settlData = await BetsService.getSettlements(betId)
        setSettlements(settlData)
      } catch (e) {
        error('[useBetDetail] markPaid', e)
        Alert.alert('Błąd', 'Nie udało się oznaczyć spłaty.')
      } finally {
        setAction('markingPaid', null)
      }
    },
    [betId, currentUserId, setAction],
  )

  const confirmPayment = useCallback(
    async (settlementId: string, creditorId: string) => {
      if (!currentUserId || creditorId !== currentUserId) return
      setAction('confirmingPayment', settlementId)
      try {
        const result = await BetsService.confirmPayment(settlementId, creditorId)
        if (result.error) {
          Alert.alert('Błąd', result.error)
          return
        }
        const settlData = await BetsService.getSettlements(betId)
        setSettlements(settlData)
      } catch (e) {
        error('[useBetDetail] confirmPayment', e)
        Alert.alert('Błąd', 'Nie udało się potwierdzić płatności.')
      } finally {
        setAction('confirmingPayment', null)
      }
    },
    [betId, currentUserId, setAction, setSettlements],
  )

  const rejectPayment = useCallback(
    async (settlementId: string, creditorId: string) => {
      if (!currentUserId || creditorId !== currentUserId) return
      setAction('rejectingPayment', settlementId)
      try {
        const result = await BetsService.rejectPayment(settlementId, creditorId)
        if (result.error) {
          Alert.alert('Błąd', result.error)
          return
        }
        const settlData = await BetsService.getSettlements(betId)
        setSettlements(settlData)
      } catch (e) {
        error('[useBetDetail] rejectPayment', e)
        Alert.alert('Błąd', 'Nie udało się odrzucić zgłoszenia płatności.')
      } finally {
        setAction('rejectingPayment', null)
      }
    },
    [betId, currentUserId, setAction, setSettlements],
  )

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
      Alert.alert('Zakład odrzucony', 'Zakład został odrzucony.')
      return true
    } catch (e) {
      error('[useBetDetail] rejectBet', e)
      Alert.alert('Błąd', 'Nie udało się odrzucić zakładu.')
      return false
    } finally {
      setAction('rejecting', false)
    }
  }, [betId, currentUserId, setAction])

  const sendReminder = useCallback(
    async (s: Settlement) => {
      if (!currentUserId || currentUserId !== s.creditorId) return
      log('[useBetDetail sendReminder] start', { settlementId: s.id, debtorId: s.debtorId })
      setAction('reminding', s.id)
      try {
        const result = await NotificationsService.sendSettlementReminderNotification({
          debtorUserId: s.debtorId,
          creditorNick: s.creditorNick,
          betId,
          amount: s.amount,
        })
        if (result.error) {
          Alert.alert('Błąd', result.error)
          return
        }
        Alert.alert('Wysłano', 'Dłużnik dostał przypomnienie w aplikacji.')
      } catch (e) {
        error('[useBetDetail] sendReminder', e)
        Alert.alert('Błąd', 'Nie udało się wysłać przypomnienia.')
      } finally {
        setAction('reminding', null)
      }
    },
    [betId, currentUserId, setAction],
  )

  return {
    submitResult,
    submitPerMatchResult,
    completeMatchSession,
    confirmResult,
    disputeResult,
    markPaid,
    confirmPayment,
    rejectPayment,
    acceptBet,
    rejectBet,
    sendReminder,
  }
}
