import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryKeys'
import { fetchRivalryData, RivalryFetchError } from '../services/rivalry/loadRivalryMatches'
import { buildRivalryTotalsFromMatches, buildStatsByDiscipline } from '../services/rivalry/mapRivalryItems'
import type { RivalryDisciplineStats, RivalryMatchItem, RivalryPaymentRow } from '../services/rivalry/rivalry.types'

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

  // gameTemplate is intentionally excluded from queryKey — we filter locally to avoid
  // extra fetches when the user switches discipline tabs
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

    const paidRows = payments.filter(p => p.paymentStatus === 'paid')
    const totalPaidByMe = paidRows.filter(p => p.fromUserId === userId).reduce((sum, p) => sum + p.amount, 0)
    const totalPaidByRival = paidRows.filter(p => p.fromUserId === friendId).reduce((sum, p) => sum + p.amount, 0)
    const pendingRows = payments.filter(p => p.paymentStatus === 'unpaid' || p.paymentStatus === 'pending_confirmation')
    const pendingAmount = pendingRows.reduce((sum, p) => sum + p.amount, 0)
    const pendingStatus = pendingRows.some(p => p.paymentStatus === 'pending_confirmation')
      ? 'pending_confirmation'
      : pendingRows.some(p => p.paymentStatus === 'unpaid')
        ? 'unpaid'
        : 'clear'
    const settledBetsCount = new Set(paidRows.map(p => p.betId)).size

    return { totalPaidByMe, totalPaidByRival, pendingAmount, pendingStatus, settledBetsCount }
  }, [friendId, payments, userId])

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

export type { RivalryMatchItem, RivalryDisciplineStats } from '../services/rivalry/rivalry.types'
