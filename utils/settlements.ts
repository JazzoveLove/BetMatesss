export type BalanceHighlight = 'positive' | 'negative' | 'neutral'

import type { StakeMode } from '../types/bet.types'

export function formatBalance(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n} zł`
}

export function balanceHighlight(n: number): BalanceHighlight {
  if (n > 0) return 'positive'
  if (n < 0) return 'negative'
  return 'neutral'
}

export type SettlementDraft = {
  debtorId: string
  creditorId: string
  amount: number
}

/** Uczestnik z kwotą stawki (np. z bet_participants). */
export type ParticipantStake = {
  id: string
  stakeAmount: number
}

/**
 * Przegrani (wszyscy oprócz zwycięzcy) z stake_amount > 0 płacą zwycięzcy swoją stawkę.
 * Przy stake_mode === 'none' brak rozliczeń pieniężnych.
 */
export function calculateSettlements(
  participants: ParticipantStake[],
  winnerId: string,
  stakeMode: StakeMode,
): SettlementDraft[] {
  if (stakeMode === 'none') return []

  const winner = participants.find(p => p.id === winnerId)
  if (!winner) return []

  return participants
    .filter(p => p.id !== winnerId && p.stakeAmount > 0)
    .map(p => ({
      debtorId: p.id,
      creditorId: winnerId,
      amount: p.stakeAmount,
    }))
}
