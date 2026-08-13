import type { BetParticipant, BetResultRow } from '../types/bet.types'

export const calculatePerMatchBalance = (
  results: BetResultRow[],
  stakePerMatch: number,
  participants: BetParticipant[],
): Record<string, number> => {
  const ids = participants.map(p => p.id)
  const balance: Record<string, number> = Object.fromEntries(ids.map(id => [id, 0]))
  const stake = Number(stakePerMatch)
  if (!Number.isFinite(stake) || stake <= 0 || ids.length !== 2) return balance

  const confirmed = results.filter(r => r.confirmed)
  for (const r of confirmed) {
    const winnerId = r.winner_id
    if (!winnerId || !ids.includes(winnerId)) continue
    const loserId = ids.find(id => id !== winnerId)
    if (!loserId) continue
    balance[winnerId] += stake
    balance[loserId] -= stake
  }
  return balance
}
