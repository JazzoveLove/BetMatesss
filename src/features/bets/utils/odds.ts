import type { StakeMode } from '../types/bet.types'

export function parseStakeAmount(input: string | number | null | undefined): number {
  if (input == null) return 0
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0
  const s = String(input).trim().replace(/\s/g, '').replace(',', '.')
  if (s === '') return 0
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

export function toStakeNumber(input: string | number | null | undefined): number {
  const n = parseStakeAmount(input)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n)
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
