import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { AuthService } from '../services/auth.service'
import { BetsService } from '../services/bets.service'
import { NotificationsService } from '../services/notifications.service'
import type { BetDetail, PendingResult, Settlement } from '../types/bet.types'
import { error, log } from '../utils/logger'

type ActionLoadingState = {
  resolving: boolean
  confirming: boolean
  disputing: boolean
  accepting: boolean
  rejecting: boolean
  completingSession: boolean
  markingPaid: string | null
  reminding: string | null
}

const initialActionLoading: ActionLoadingState = {
  resolving: false,
  confirming: false,
  disputing: false,
  accepting: false,
  rejecting: false,
  completingSession: false,
  markingPaid: null,
  reminding: null,
}

export function useBetDetail(betId: string) {
  const [loading, setLoading] = useState(true)
  const [bet, setBet] = useState<BetDetail | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [score, setScore] = useState('')
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null)
  const [actionLoading, setActionLoading] = useState<ActionLoadingState>(initialActionLoading)

  const setAction = useCallback(<K extends keyof ActionLoadingState>(key: K, value: ActionLoadingState[K]) => {
    setActionLoading(prev => ({ ...prev, [key]: value }))
  }, [])

  const loadData = useCallback(async () => {
    log('[useBetDetail loadData] start', { betId })
    try {
      const userId = await AuthService.getCurrentUserId()
      if (!userId) return
      setCurrentUserId(userId)

      const [betData, nextSettlements] = await Promise.all([
        BetsService.getBetDetail(betId),
        BetsService.getSettlements(betId),
      ])

      log('[useBetDetail loadData] bet + settlements', {
        status: betData?.status,
        settlementsCount: nextSettlements.length,
      })

      let nextPending: PendingResult | null = null
      if (
        betData &&
        betData.format !== 'per_match' &&
        (betData.status === 'awaiting_confirmation' || betData.status === 'disputed')
      ) {
        nextPending = await BetsService.getPendingBetResult(betId)
        log('[useBetDetail loadData] pending result', nextPending)
      }

      setBet(betData)
      setPendingResult(nextPending)
      setSettlements(nextSettlements)
      if (nextPending?.score) setScore(nextPending.score)
      log('[useBetDetail loadData] done')
    } catch (e) {
      error('[useBetDetail loadData]', e)
    }
  }, [betId])

  useEffect(() => {
    loadData().finally(() => setLoading(false))
  }, [loadData])

  useEffect(() => {
    const participantsChannel = supabase
      .channel(`bet-participants-${betId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bet_participants',
          filter: `bet_id=eq.${betId}`,
        },
        () => {
          void loadData()
        },
      )
      .subscribe()

    const betsChannel = supabase
      .channel(`bet-row-${betId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bets',
          filter: `id=eq.${betId}`,
        },
        () => {
          void loadData()
        },
      )
      .subscribe()

    const betResultsChannel = supabase
      .channel(`bet-results-${betId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bet_results',
          filter: `bet_id=eq.${betId}`,
        },
        () => {
          void loadData()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bet_results',
          filter: `bet_id=eq.${betId}`,
        },
        () => {
          void loadData()
        },
      )
      .subscribe()

    const settlementsChannel = supabase
      .channel(`settlements-${betId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'settlements',
          filter: `bet_id=eq.${betId}`,
        },
        payload => {
          log('[useBetDetail realtime] settlements INSERT', payload)
          void loadData()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'settlements',
          filter: `bet_id=eq.${betId}`,
        },
        payload => {
          log('[useBetDetail realtime] settlements UPDATE', payload)
          void loadData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(participantsChannel)
      supabase.removeChannel(betsChannel)
      supabase.removeChannel(betResultsChannel)
      supabase.removeChannel(settlementsChannel)
    }
  }, [betId, loadData])

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
        const result = await BetsService.markSettlementPaid(settlementId, debtorId)
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

  const {
    resolving,
    confirming,
    disputing,
    accepting,
    rejecting,
    completingSession,
    markingPaid,
    reminding,
  } = actionLoading

  return {
    loading,
    bet,
    settlements,
    currentUserId,
    score,
    setScore,
    resolving,
    confirming,
    disputing,
    markingPaid,
    reminding,
    pendingResult,
    submitResult,
    confirmResult,
    disputeResult,
    markPaid,
    sendReminder,
    acceptBet,
    rejectBet,
    accepting,
    rejecting,
    submitPerMatchResult,
    completeMatchSession,
    completingSession,
    reload: loadData,
  }
}
