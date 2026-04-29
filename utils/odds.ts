import type { StakeMode } from '../types/bet.types'

/** Kwoty z TextInput (np. "10,5") i z JSON Supabase (string/number). */
export function parseStakeAmount(input: string | number | null | undefined): number {
  if (input == null) return 0
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0
  const s = String(input).trim().replace(/\s/g, '').replace(',', '.')
  if (s === '') return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

/** Kwota jako liczba dla `bet_participants.stake_amount` (2 miejsca po przecinku). */
export function toStakeNumber(input: string | number | null | undefined): number {
  const n = parseStakeAmount(input)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100) / 100
}

export function calcOdds(
  participantStake: number,
  allParticipants: { customStake: number }[],
  globalStake: number,
  mode: StakeMode,
): number {
  const g = parseStakeAmount(globalStake)
  if (mode === 'none') return 0
  if (mode === 'equal') {
    const total = g * allParticipants.length
    return g > 0 ? Math.round((total / g) * 100) / 100 : 0
  }
  const total = allParticipants.reduce((s, p) => s + parseStakeAmount(p.customStake), 0)
  return participantStake > 0 ? Math.round((total / participantStake) * 100) / 100 : 0
}

export function calculateOdds(stakes: Record<string, number>): Record<string, number> {
  const total = Object.values(stakes).reduce((sum, value) => sum + parseStakeAmount(value), 0)
  const result: Record<string, number> = {}

  Object.entries(stakes).forEach(([userId, stake]) => {
    const normalizedStake = parseStakeAmount(stake)
    result[userId] = normalizedStake > 0 ? total / normalizedStake : 0
  })

  return result
}
