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
