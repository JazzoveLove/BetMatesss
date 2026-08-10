import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/features/auth'
import { queryKeys } from '@/shared/lib/queryKeys'
import { fetchRivalryData, RivalryFetchError } from '@/features/rivalry/api/loadRivalryMatches'
import { buildRivalryTotalsFromMatches, buildStatsByDiscipline } from '@/features/rivalry/api/mapRivalryItems'
import type { RivalryDisciplineStats, RivalryMatchItem, RivalryPaymentRow } from '@/features/rivalry/api/rivalry.types'

type RivalryPaymentSummary = {
  totalPaidByMe: number
  totalPaidByRival: number
  pendingAmount: number
  pendingStatus: 'unpaid' | 'pending_confirmation' | 'clear'
  settledBetsCount: number
}

type UseRivalryResult = {
  loading: boolean
  refreshing: boolean
  error: string | null
  friendNick: string
  matches: RivalryMatchItem[]
  disciplines: string[]
  selectedDiscipline: string | null
  setSelectedDiscipline: (discipline: string | null) => void
  filteredMatches: RivalryMatchItem[]
  statsByDiscipline: RivalryDisciplineStats[]
  totals: { wins: number; losses: number; winRatePct: number; balance: number }
  paymentSummary: RivalryPaymentSummary
  onRefresh: () => Promise<void>
}

export function useRivalry(friendId: string, gameTemplate?: string): UseRivalryResult {
  const { userId } = useAuthContext()
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(gameTemplate ?? null)

  useEffect(() => {
    setSelectedDiscipline(gameTemplate ?? null)
  }, [gameTemplate])

  const { data, isLoading, isRefetching, refetch, error: queryError } = useQuery({
    queryKey: queryKeys.rivalry(userId ?? '', friendId),
    queryFn: () => fetchRivalryData(userId!, friendId, null),
    enabled: !!userId && !!friendId,
  })

  const error = useMemo(() => {
    if (!queryError) return null
    return queryError instanceof Error ? queryError.message : 'Nie udało się pobrać rywalizacji.'
  }, [queryError])

  const friendNick = useMemo(() => {
    if (queryError instanceof RivalryFetchError) return queryError.friendNick
    return data?.friendNick ?? 'Znajomy'
  }, [data, queryError])

  const matches = data?.matches ?? ([] as RivalryMatchItem[])
  const payments = data?.payments ?? ([] as RivalryPaymentRow[])

  const disciplines = useMemo(
    () => [...new Set(matches.map(m => m.gameTemplate))].sort((a, b) => a.localeCompare(b)),
    [matches],
  )

  const filteredMatches = useMemo(() => {
    if (!selectedDiscipline) return matches
    return matches.filter(m => m.gameTemplate === selectedDiscipline)
  }, [matches, selectedDiscipline])

  const statsByDiscipline = useMemo(() => buildStatsByDiscipline(matches), [matches])
  const totals = useMemo(() => buildRivalryTotalsFromMatches(filteredMatches), [filteredMatches])

  const paymentSummary = useMemo<RivalryPaymentSummary>(() => {
    if (!userId) {
      return { totalPaidByMe: 0, totalPaidByRival: 0, pendingAmount: 0, pendingStatus: 'clear', settledBetsCount: 0 }
    }

    const pendingAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const pendingStatus = payments.length > 0 ? 'unpaid' : 'clear'

    return { totalPaidByMe: 0, totalPaidByRival: 0, pendingAmount, pendingStatus, settledBetsCount: 0 }
  }, [payments, userId])

  return {
    loading: isLoading,
    refreshing: isRefetching,
    error,
    friendNick,
    matches,
    disciplines,
    selectedDiscipline,
    setSelectedDiscipline,
    filteredMatches,
    statsByDiscipline,
    totals,
    paymentSummary,
    onRefresh: async () => { await refetch() },
  }
}

export type { RivalryMatchItem, RivalryDisciplineStats } from '@/features/rivalry/api/rivalry.types'
