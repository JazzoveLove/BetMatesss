import type { BalanceCounts, BalanceFilter, BalanceRow, BalanceSummary } from '@/features/balances/types/balance.types'

function isPositive(row: BalanceRow): boolean {
  return row.balance > 0
}

function isNegative(row: BalanceRow): boolean {
  return row.balance < 0
}

function isZero(row: BalanceRow): boolean {
  return row.balance === 0
}

export function getBalanceCounts(allRows: BalanceRow[]): BalanceCounts {
  return {
    all: allRows.length,
    positive: allRows.filter(isPositive).length,
    negative: allRows.filter(isNegative).length,
    zero: allRows.filter(isZero).length,
  }
}

export function filterBalanceRows(allRows: BalanceRow[], filter: BalanceFilter): BalanceRow[] {
  if (filter === 'positive') return allRows.filter(isPositive)
  if (filter === 'negative') return allRows.filter(isNegative)
  if (filter === 'zero') return allRows.filter(isZero)
  return allRows
}

const byNickPl = (a: BalanceRow, b: BalanceRow) => a.nick.localeCompare(b.nick, 'pl')

/**
 * Sortuje wiersze zgodnie z regułą aktywnego filtra. Dla "all" wejściem musi
 * być pełna, nieprzefiltrowana lista — sam grupuje dodatnie/ujemne/zerowe.
 * Dla pozostałych filtrów zakłada, że rows jest już przefiltrowane (np. przez
 * filterBalanceRows) — sortuje bez ponownego odcinania.
 */
export function sortBalanceRows(rows: BalanceRow[], filter: BalanceFilter): BalanceRow[] {
  if (filter === 'positive') return [...rows].sort((a, b) => b.balance - a.balance)
  if (filter === 'negative') return [...rows].sort((a, b) => a.balance - b.balance)
  if (filter === 'zero') return [...rows].sort(byNickPl)

  const positives = rows.filter(isPositive).sort((a, b) => b.balance - a.balance)
  const negatives = rows.filter(isNegative).sort((a, b) => a.balance - b.balance)
  const zeros = rows.filter(isZero).sort(byNickPl)
  return [...positives, ...negatives, ...zeros]
}

export function getVisibleBalances(allRows: BalanceRow[], filter: BalanceFilter): BalanceRow[] {
  return sortBalanceRows(filterBalanceRows(allRows, filter), filter)
}

/** allRows musi być pełną, nieprzefiltrowaną listą — totalCount/RAZEM zawsze liczy się z niej, niezależnie od filter. */
export function getBalanceSummary(allRows: BalanceRow[], filter: BalanceFilter): BalanceSummary {
  const totalCount = allRows.length

  if (filter === 'positive') {
    const positives = allRows.filter(isPositive)
    return {
      filter: 'positive',
      totalCount,
      filteredCount: positives.length,
      sum: positives.reduce((acc, r) => acc + r.balance, 0),
    }
  }

  if (filter === 'negative') {
    const negatives = allRows.filter(isNegative)
    return {
      filter: 'negative',
      totalCount,
      filteredCount: negatives.length,
      sum: negatives.reduce((acc, r) => acc + r.balance, 0),
    }
  }

  if (filter === 'zero') {
    const zeros = allRows.filter(isZero)
    return { filter: 'zero', totalCount, filteredCount: zeros.length }
  }

  return {
    filter: 'all',
    totalCount,
    netSum: allRows.reduce((acc, r) => acc + r.balance, 0),
  }
}
