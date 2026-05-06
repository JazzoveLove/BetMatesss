import type { ProfileStatSection, ProfileStatsV2 } from '../types/bet.types'

export type WLEntry = {
  win: boolean
  loss: boolean
  balance: number
  gameTemplate: string
}

export function buildProfileSection(entries: WLEntry[]): ProfileStatSection {
  const byTemplate = new Map<string, { wins: number; losses: number; balance: number }>()
  let totalWins = 0
  let totalLosses = 0
  let totalBalance = 0

  for (const e of entries) {
    if (e.win) totalWins++
    if (e.loss) totalLosses++
    totalBalance += e.balance

    const agg = byTemplate.get(e.gameTemplate) ?? { wins: 0, losses: 0, balance: 0 }
    if (e.win) agg.wins++
    if (e.loss) agg.losses++
    agg.balance += e.balance
    byTemplate.set(e.gameTemplate, agg)
  }

  const total = totalWins + totalLosses
  return {
    wins: totalWins,
    losses: totalLosses,
    winRate: total > 0 ? Math.round((totalWins / total) * 100) : 0,
    balance: totalBalance,
    disciplines: [...byTemplate.entries()]
      .map(([gameTemplate, agg]) => ({
        gameTemplate,
        wins: agg.wins,
        losses: agg.losses,
        winPct:
          agg.wins + agg.losses > 0
            ? Math.round((agg.wins / (agg.wins + agg.losses)) * 100)
            : 0,
        balance: agg.balance,
      }))
      .sort((a, b) => b.wins + b.losses - (a.wins + a.losses)),
  }
}

export function computeProfileStatsV2(
  moneyEntries: WLEntry[],
  friendlyEntries: WLEntry[],
): ProfileStatsV2 {
  return {
    overall: buildProfileSection([...moneyEntries, ...friendlyEntries]),
    money: moneyEntries.length > 0 ? buildProfileSection(moneyEntries) : null,
    friendly: friendlyEntries.length > 0 ? buildProfileSection(friendlyEntries) : null,
  }
}
