/** Mapowanie danych rywalizacji na typy aplikacyjne */

import type { RivalryDisciplineStats, RivalryMatchItem, RivalryTotals } from './rivalry.types'

type BetRow = {
  id: string
  rivalry_id: string
  game_template: string
  created_at: string
  stake_mode: string
}

type ResultRow = {
  winner_id: string | null
  scores: { score?: string } | null
}

export function mapBetRowsToRivalryMatchItems(
  betRows: BetRow[],
  rivalryById: Map<string, { id: string }>,
  resultByBetId: Map<string, ResultRow>,
  settlementByBetId: Map<string, { debtor_id: string; creditor_id: string; amount: number }[]>,
  stakeByBetId: Map<string, number>,
  currentUserId: string,
): RivalryMatchItem[] {
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
  return items
}

export function buildStatsByDiscipline(matches: RivalryMatchItem[]): RivalryDisciplineStats[] {
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
}

export function buildRivalryTotalsFromMatches(matches: RivalryMatchItem[]): RivalryTotals {
  const wins = matches.filter(m => m.outcome === 'win').length
  const losses = matches.filter(m => m.outcome === 'loss').length
  const all = wins + losses
  const winRatePct = all > 0 ? Math.round((wins / all) * 100) : 0
  const balance = matches.reduce((acc, m) => acc + m.profit, 0)
  return { wins, losses, winRatePct, balance }
}
