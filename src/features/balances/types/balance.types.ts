export type BalanceFilter = 'all' | 'positive' | 'negative' | 'zero'

export type BalanceRow = {
  id: string
  nick: string
  avatarUrl: string | null
  balance: number
  matchCount: number
}

export type BalanceCounts = {
  all: number
  positive: number
  negative: number
  zero: number
}

export type BalanceSummary =
  | { filter: 'all'; totalCount: number; netSum: number }
  | { filter: 'positive'; totalCount: number; filteredCount: number; sum: number }
  | { filter: 'negative'; totalCount: number; filteredCount: number; sum: number }
  | { filter: 'zero'; totalCount: number; filteredCount: number }
