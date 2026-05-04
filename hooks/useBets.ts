import { useCallback, useEffect, useMemo, useState } from 'react'
import { BetsService } from '../services/bets.service'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { error as logError } from '../utils/logger'
import type { BetSummary, CreateBetParams } from '../types/bet.types'

export function useBets() {
  const { userId } = useAuthContext()
  const [bets, setBets] = useState<BetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshBets = useCallback(async () => {
    setError(null)
    if (!userId) {
      setBets([])
      return
    }
    try {
      const data = await BetsService.getUserBetSummaries(userId)
      setBets(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udalo sie pobrac zakladow')
    }
  }, [userId])

  useEffect(() => {
    refreshBets().finally(() => setLoading(false))
  }, [refreshBets])

  useEffect(() => {
    let cancelled = false

    const channel = supabase
      .channel('bets-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bets',
        },
        payload => {
          const prevStatus = (payload.old as { status?: string } | null)?.status
          const nextStatus = (payload.new as { status?: string } | null)?.status
          if (prevStatus !== nextStatus && (nextStatus === 'active' || nextStatus === 'awaiting_confirmation' || nextStatus === 'completed')) {
            refreshBets()
          }
        },
      )
      .subscribe((status, err) => {
        if (cancelled) return
        if (status === 'CHANNEL_ERROR') {
          setError(err?.message ?? 'Błąd połączenia realtime')
        }
        if (status === 'TIMED_OUT') {
          setError('Przekroczono czas połączenia realtime')
        }
      })

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [refreshBets])

  const createBet = useCallback(async (params: CreateBetParams) => {
    setError(null)
    try {
      const result = await BetsService.createBet(params)
      if ('error' in result) {
        setError(result.error)
        throw new Error(result.error)
      }
      await refreshBets().catch(err => setError(err instanceof Error ? err.message : 'Nie udało się odświeżyć listy'))
      return result
    } catch (e) {
      logError('[useBets] createBet', e)
      setError(e instanceof Error ? e.message : 'Nie udało się utworzyć zakładu')
      throw e
    }
  }, [refreshBets])

  const activeBets = useMemo(
    () =>
      bets.filter(
        b =>
          b.status === 'pending' ||
          b.status === 'active' ||
          b.status === 'in_progress' ||
          b.status === 'awaiting_confirmation',
      ),
    [bets],
  )

  return {
    bets,
    activeBets,
    loading,
    error,
    createBet,
    refreshBets,
  }
}
