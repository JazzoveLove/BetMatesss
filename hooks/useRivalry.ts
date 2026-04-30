import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthService } from '../services/auth.service'
import { supabase } from '../lib/supabase'

type RivalryMatchItem = {
  betId: string
  rivalryId: string
  gameTemplate: string
  createdAt: string
  score: string | null
  stakeAmount: number
  profit: number
  outcome: 'win' | 'loss' | 'draw'
}

type RivalryDisciplineStats = {
  gameTemplate: string
  wins: number
  losses: number
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
  totals: {
    wins: number
    losses: number
    winRatePct: number
    balance: number
  }
  onRefresh: () => Promise<void>
}

export function useRivalry(friendId: string, gameTemplate?: string): UseRivalryResult {
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
    const currentUserId = await AuthService.getCurrentUserId()
    if (!currentUserId) {
      setMatches([])
      setFriendNick('Znajomy')
      return
    }

    const { data: friendRow } = await supabase.from('users').select('nick').eq('id', friendId).maybeSingle()
    if (friendRow && typeof (friendRow as { nick?: string }).nick === 'string') {
      setFriendNick((friendRow as { nick: string }).nick)
    } else {
      setFriendNick('Znajomy')
    }

    const { data: rivalries, error: rivalriesError } = await supabase
      .from('rivalries')
      .select('id, game_template, participant_ids')
      .contains('participant_ids', [currentUserId, friendId])

    if (rivalriesError) {
      setError(rivalriesError.message)
      setMatches([])
      return
    }

    const rivalryRows = (rivalries ?? []) as {
      id: string
      game_template: string
      participant_ids: string[]
    }[]

    const oneOnOneRivalries = rivalryRows.filter(row => {
      const ids = row.participant_ids ?? []
      return ids.length === 2 && ids.includes(currentUserId) && ids.includes(friendId)
    })

    const filteredByTemplate = gameTemplate
      ? oneOnOneRivalries.filter(row => row.game_template === gameTemplate)
      : oneOnOneRivalries

    if (filteredByTemplate.length === 0) {
      setMatches([])
      return
    }

    const rivalryById = new Map(filteredByTemplate.map(r => [r.id, r]))
    const rivalryIds = filteredByTemplate.map(r => r.id)

    const [{ data: bets, error: betsError }, { data: results, error: resultsError }, { data: settlements, error: settlementsError }, { data: betParticipants, error: participantsError }] = await Promise.all([
      supabase
        .from('bets')
        .select('id, rivalry_id, game_template, created_at, stake_mode, status')
        .in('rivalry_id', rivalryIds)
        .eq('status', 'completed')
        .order('created_at', { ascending: false }),
      supabase
        .from('bet_results')
        .select('bet_id, winner_id, scores, confirmed, created_at')
        .eq('confirmed', true),
      supabase
        .from('settlements')
        .select('bet_id, debtor_id, creditor_id, amount'),
      supabase
        .from('bet_participants')
        .select('bet_id, user_id, stake_amount')
        .eq('user_id', currentUserId),
    ])

    if (betsError || resultsError || settlementsError || participantsError) {
      setError(
        betsError?.message ??
          resultsError?.message ??
          settlementsError?.message ??
          participantsError?.message ??
          'Nie udało się pobrać rywalizacji.',
      )
      setMatches([])
      return
    }

    const betRows = (bets ?? []) as {
      id: string
      rivalry_id: string
      game_template: string
      created_at: string
      stake_mode: string
    }[]
    const betIds = new Set(betRows.map(b => b.id))

    const resultByBetId = new Map<string, { winner_id: string | null; scores: { score?: string } | null }>()
    for (const row of (results ?? []) as {
      bet_id: string
      winner_id: string | null
      scores: { score?: string } | null
    }[]) {
      if (!betIds.has(row.bet_id)) continue
      if (!resultByBetId.has(row.bet_id)) resultByBetId.set(row.bet_id, row)
    }

    const settlementByBetId = new Map<string, { debtor_id: string; creditor_id: string; amount: number }[]>()
    for (const row of (settlements ?? []) as {
      bet_id: string
      debtor_id: string
      creditor_id: string
      amount: number
    }[]) {
      if (!betIds.has(row.bet_id)) continue
      const list = settlementByBetId.get(row.bet_id) ?? []
      list.push(row)
      settlementByBetId.set(row.bet_id, list)
    }

    const stakeByBetId = new Map<string, number>()
    for (const row of (betParticipants ?? []) as {
      bet_id: string
      user_id: string
      stake_amount: number | string
    }[]) {
      const amount = Number(row.stake_amount)
      stakeByBetId.set(row.bet_id, Number.isFinite(amount) ? amount : 0)
    }

    const items: RivalryMatchItem[] = betRows.map(row => {
      const result = resultByBetId.get(row.id)
      const relSettlements = settlementByBetId.get(row.id) ?? []

      let profit = 0
      for (const s of relSettlements) {
        if (s.creditor_id === currentUserId) profit += Number(s.amount)
        if (s.debtor_id === currentUserId) profit -= Number(s.amount)
      }

      const outcome: RivalryMatchItem['outcome'] =
        profit > 0 ? 'win' : profit < 0 ? 'loss' : 'draw'

      return {
        betId: row.id,
        rivalryId: row.rivalry_id ?? rivalryById.get(row.rivalry_id)?.id ?? '',
        gameTemplate: row.game_template,
        createdAt: row.created_at,
        score: result?.scores?.score ?? null,
        stakeAmount: stakeByBetId.get(row.id) ?? 0,
        profit,
        outcome,
      }
    })

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    setMatches(items)
  }, [friendId, gameTemplate])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  const disciplines = useMemo(
    () => [...new Set(matches.map(m => m.gameTemplate))].sort((a, b) => a.localeCompare(b)),
    [matches],
  )

  const filteredMatches = useMemo(() => {
    if (!selectedDiscipline) return matches
    return matches.filter(m => m.gameTemplate === selectedDiscipline)
  }, [matches, selectedDiscipline])

  const statsByDiscipline = useMemo(() => {
    const byTemplate = new Map<string, { wins: number; losses: number }>()
    for (const m of matches) {
      const agg = byTemplate.get(m.gameTemplate) ?? { wins: 0, losses: 0 }
      if (m.outcome === 'win') agg.wins += 1
      if (m.outcome === 'loss') agg.losses += 1
      byTemplate.set(m.gameTemplate, agg)
    }
    return [...byTemplate.entries()].map(([gameTemplate, value]) => ({
      gameTemplate,
      wins: value.wins,
      losses: value.losses,
    }))
  }, [matches])

  const totals = useMemo(() => {
    const wins = filteredMatches.filter(m => m.outcome === 'win').length
    const losses = filteredMatches.filter(m => m.outcome === 'loss').length
    const all = wins + losses
    const winRatePct = all > 0 ? Math.round((wins / all) * 100) : 0
    const balance = filteredMatches.reduce((acc, m) => acc + m.profit, 0)
    return { wins, losses, winRatePct, balance }
  }, [filteredMatches])

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
