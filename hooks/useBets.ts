import { useCallback, useEffect, useMemo, useState } from 'react'
import { BetsService } from '../services/bets.service'
import { AuthService } from '../services/auth.service'
import { supabase } from '../lib/supabase'
import type { BetRow, CreateBetParams } from '../types/bet.types'

export function useBets() {
  const [bets, setBets] = useState<BetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshBets = useCallback(async () => {
    setError(null)
    const userId = await AuthService.getCurrentUserId()
    if (!userId) {
      setBets([])
      return
    }
    try {
      const data = await BetsService.getUserBets(userId)
      setBets(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udalo sie pobrac zakladow')
    }
  }, [])

  useEffect(() => {
    refreshBets().finally(() => setLoading(false))
  }, [refreshBets])

  useEffect(() => {
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshBets])

  const createBet = useCallback(async (params: CreateBetParams) => {
    setError(null)
    const result = await BetsService.createBet(params)
    if ('error' in result) {
      setError(result.error)
      throw new Error(result.error)
    }
    await refreshBets()
    return result
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
