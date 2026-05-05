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

export type PaymentStatus = 'unpaid' | 'pending_confirmation' | 'paid' | 'disputed'

export type SettlementHandshake = {
  id: string
  debtorId: string
  creditorId: string
  amount: number
  paymentStatus: PaymentStatus
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

/** Jedna para przelewów dla 2 graczy z bilansu netto (suma bilansów = 0). */
export function settlementDraftsFromPairBalances(
  balanceByUserId: Record<string, number>,
  participantIds: string[],
): SettlementDraft[] {
  if (participantIds.length !== 2) return []
  const [a, b] = [...participantIds].sort()
  const balA = balanceByUserId[a] ?? 0
  if (balA === 0) return []
  if (balA > 0) return [{ debtorId: b, creditorId: a, amount: balA }]
  return [{ debtorId: a, creditorId: b, amount: -balA }]
}

export function markAsPaid(settlement: SettlementHandshake, actorUserId: string): SettlementHandshake {
  if (settlement.debtorId !== actorUserId) throw new Error('Tylko dłużnik może zgłosić zapłatę')
  if (settlement.paymentStatus !== 'unpaid') throw new Error('Można zgłosić zapłatę tylko dla nieopłaconego długu')
  return { ...settlement, paymentStatus: 'pending_confirmation' }
}

export function confirmPayment(settlement: SettlementHandshake, actorUserId: string): SettlementHandshake {
  if (settlement.creditorId !== actorUserId) throw new Error('Tylko wierzyciel może potwierdzić płatność')
  if (settlement.paymentStatus !== 'pending_confirmation') throw new Error('Płatność nie oczekuje na potwierdzenie')
  return { ...settlement, paymentStatus: 'paid' }
}

export function rejectPayment(settlement: SettlementHandshake, actorUserId: string): SettlementHandshake {
  if (settlement.creditorId !== actorUserId) throw new Error('Tylko wierzyciel może odrzucić płatność')
  if (settlement.paymentStatus !== 'pending_confirmation') throw new Error('Płatność nie oczekuje na potwierdzenie')
  return { ...settlement, paymentStatus: 'disputed' }
}

export function calculateActiveBalance(
  settlements: SettlementHandshake[],
  userId: string,
): number {
  return settlements.reduce((acc, s) => {
    if (s.paymentStatus === 'paid') return acc
    if (s.creditorId === userId) return acc + s.amount
    if (s.debtorId === userId) return acc - s.amount
    return acc
  }, 0)
}
