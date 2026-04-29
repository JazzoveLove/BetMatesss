import type { GameTemplate } from '../constants/games'
import type { BetFormat, BetParticipant, BetResultRow } from '../types/bet.types'

const FORMAT_MIN_PLAYERS: Record<BetFormat, number> = {
  single: 2,
  best_of: 2,
  per_match: 2,
  round_robin: 3,
  elimination: 4,
  session: 2,
}

const FORMAT_MAX_PLAYERS: Record<BetFormat, number> = {
  single: Number.POSITIVE_INFINITY,
  best_of: 2,
  per_match: 2,
  round_robin: Number.POSITIVE_INFINITY,
  elimination: Number.POSITIVE_INFINITY,
  session: Number.POSITIVE_INFINITY,
}

export const getAvailableFormats = (
  game: GameTemplate,
  participantCount: number,
): BetFormat[] => {
  const total = participantCount + 1

  return game.availableFormats.filter(format => {
    const min = FORMAT_MIN_PLAYERS[format] ?? 2
    const max = FORMAT_MAX_PLAYERS[format] ?? Number.POSITIVE_INFINITY
    return total >= min && total <= max
  })
}

export const getDefaultFormat = (
  game: GameTemplate,
  participantCount: number,
): BetFormat => {
  const total = participantCount + 1

  if (game.id === 'poker') return 'single'

  if (total >= 4 && game.availableFormats.includes('elimination')) {
    return 'elimination'
  }
  if (total === 3 && game.availableFormats.includes('round_robin')) {
    return 'round_robin'
  }
  return game.defaultFormat
}

/** Bilans netto z rozegranych meczów (tylko 2 graczy): zwycięzca +stake, przegrany −stake. */
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
