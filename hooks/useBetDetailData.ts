/** Stan i ładowanie danych szczegółów zakładu */

import { useCallback, useEffect, useState } from 'react'
import { AuthService } from '../services/auth.service'
import { BetsService } from '../services/bets.service'
import type { BetDetail, PendingResult, Settlement } from '../types/bet.types'
import { error, log } from '../utils/logger'

export type ActionLoadingState = {
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

export function useBetDetailData(betId: string) {
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

  return {
    loading,
    bet,
    settlements,
    currentUserId,
    score,
    setScore,
    pendingResult,
    actionLoading,
    setAction,
    loadData,
    setSettlements,
    setPendingResult,
  }
}
