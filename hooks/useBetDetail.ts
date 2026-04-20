import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { AuthService } from '../services/auth.service'
import { BetsService } from '../services/bets.service'
import { NotificationsService } from '../services/notifications.service'
import type { BetDetail, Settlement } from '../types/bet.types'

type PendingResult = {
  id: string
  winnerId: string
  score: string
  recordedBy: string
  confirmed: boolean
}

export function useBetDetail(betId: string) {
  const [loading, setLoading] = useState(true)
  const [bet, setBet] = useState<BetDetail | null>(null)
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [score, setScore] = useState('')
  const [pendingResult, setPendingResult] = useState<PendingResult | null>(null)
  const [resolving, setResolving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [disputing, setDisputing] = useState(false)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [reminding, setReminding] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const userId = await AuthService.getCurrentUserId()
    if (!userId) return
    setCurrentUserId(userId)

    const [betData, nextSettlements] = await Promise.all([
      BetsService.getBetDetail(betId),
      BetsService.getSettlements(betId),
    ])

    let nextPending: PendingResult | null = null
    if (betData?.status === 'awaiting_confirmation' || betData?.status === 'disputed') {
      nextPending = await BetsService.getPendingBetResult(betId)
    }

    setBet(betData)
    setPendingResult(nextPending)
    setSettlements(nextSettlements)
    if (nextPending?.score) setScore(nextPending.score)
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
          event: 'UPDATE',
          schema: 'public',
          table: 'bet_participants',
          filter: `bet_id=eq.${betId}`,
        },
        payload => {
          const prevConfirmed = (payload.old as { confirmed?: boolean } | null)?.confirmed
          const nextConfirmed = (payload.new as { confirmed?: boolean } | null)?.confirmed
          if (prevConfirmed === false && nextConfirmed === true) {
            void loadData()
          }
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

    return () => {
      supabase.removeChannel(participantsChannel)
      supabase.removeChannel(betsChannel)
      supabase.removeChannel(betResultsChannel)
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
      setResolving(true)
      const result = await BetsService.submitBetResult({
        betId,
        winnerId,
        score: resultScore,
        recordedBy: currentUserId,
      })
      setResolving(false)
      if (result.error) {
        Alert.alert('Błąd', result.error)
        return false
      }
      setScore(resultScore)
      await loadData()
      return true
    },
    [bet, currentUserId, score, betId, loadData],
  )

  const confirmResult = useCallback(async () => {
    if (!bet || !currentUserId || !pendingResult) return
    setConfirming(true)
    const result = await BetsService.confirmBetResult({
      betId,
      resultId: pendingResult.id,
      confirmerId: currentUserId,
    })
    setConfirming(false)
    if (result.error) {
      Alert.alert('Błąd', result.error)
      return
    }
    await loadData()
  }, [bet, betId, currentUserId, pendingResult, loadData])

  const disputeResult = useCallback(async () => {
    if (!pendingResult) return
    setDisputing(true)
    const result = await BetsService.disputeBetResult(betId)
    setDisputing(false)
    if (result.error) {
      Alert.alert('Błąd', result.error)
      return
    }
    await loadData()
  }, [betId, pendingResult, loadData])

  const markPaid = useCallback(
    async (settlementId: string) => {
      if (!currentUserId) return
      setMarkingPaid(settlementId)
      await BetsService.markSettlementPaid(settlementId)
      setMarkingPaid(null)
      const settlData = await BetsService.getSettlements(betId)
      setSettlements(settlData)
    },
    [betId, currentUserId],
  )

  const sendReminder = useCallback(
    async (s: Settlement) => {
      if (!currentUserId || currentUserId !== s.creditorId) return
      setReminding(s.id)
      const result = await NotificationsService.sendSettlementReminderNotification({
        debtorUserId: s.debtorId,
        creditorNick: s.creditorNick,
        betId,
        amount: s.amount,
      })
      setReminding(null)
      if (result.error) {
        Alert.alert('Błąd', result.error)
        return
      }
      Alert.alert('Wysłano', 'Dłużnik dostał przypomnienie w aplikacji.')
    },
    [betId, currentUserId],
  )

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
    reload: loadData,
  }
}
