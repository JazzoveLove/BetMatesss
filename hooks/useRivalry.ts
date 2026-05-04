import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { fetchRivalryData, RivalryFetchError } from '../services/rivalry/loadRivalryMatches'
import { buildRivalryTotalsFromMatches, buildStatsByDiscipline } from '../services/rivalry/mapRivalryItems'
import type { RivalryDisciplineStats, RivalryMatchItem } from '../services/rivalry/rivalry.types'
import { error as logError } from '../utils/logger'

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
  onRefresh: () => Promise<void>
}

export function useRivalry(friendId: string, gameTemplate?: string): UseRivalryResult {
  const { userId } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [friendNick, setFriendNick] = useState('Znajomy')
  const [matches, setMatches] = useState<RivalryMatchItem[]>([])
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(gameTemplate ?? null)

  useEffect(() => {
    setSelectedDiscipline(gameTemplate ?? null)
  }, [gameTemplate])

  const load = useCallback(async () => {
    setError(null)
    if (!userId) {
      setMatches([])
      setFriendNick('Znajomy')
      return
    }
    try {
      const data = await fetchRivalryData(userId, friendId, gameTemplate ?? null)
      setMatches(data.matches)
      setFriendNick(data.friendNick)
    } catch (e) {
      logError('[useRivalry] load', e)
      if (e instanceof RivalryFetchError) setFriendNick(e.friendNick)
      setError(e instanceof Error ? e.message : 'Nie udało się pobrać rywalizacji.')
      setMatches([])
    }
  }, [friendId, gameTemplate, userId])

  useEffect(() => {
    void load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await load()
    } catch (e) {
      logError('[useRivalry] onRefresh', e)
    } finally {
      setRefreshing(false)
    }
  }, [load])

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

  return {
    loading,
    refreshing,
    error,
    friendNick,
    matches,
    disciplines,
    selectedDiscipline,
    setSelectedDiscipline,
    filteredMatches,
    statsByDiscipline,
    totals,
    onRefresh,
  }
}

export type { RivalryMatchItem, RivalryDisciplineStats } from '../services/rivalry/rivalry.types'
