import type { StakeMode } from '@/features/bets/types/bet.types'

export type BalanceHighlight = 'positive' | 'negative' | 'neutral'

export function formatBalance(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n} j.`
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

export type ParticipantStake = {
  id: string
  stakeAmount: number
}

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
