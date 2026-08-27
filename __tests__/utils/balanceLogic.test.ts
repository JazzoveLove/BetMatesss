import {
  filterBalanceRows,
  getBalanceCounts,
  getBalanceSummary,
  sortBalanceRows,
} from '@/features/balances/utils/balanceLogic'
import type { BalanceRow } from '@/features/balances/types/balance.types'

function row(id: string, nick: string, balance: number): BalanceRow {
  return { id, nick, avatarUrl: null, balance, matchCount: 0 }
}

const EMPTY: BalanceRow[] = []
const ALL_POSITIVE = [row('1', 'Ala', 10), row('2', 'Beata', 50), row('3', 'Celina', 5)]
const ALL_NEGATIVE = [row('1', 'Ala', -10), row('2', 'Beata', -100), row('3', 'Celina', -5)]
const ALL_ZERO = [row('1', 'Ala', 0), row('2', 'Beata', 0)]
const MIX = [row('1', 'Ala', 30), row('2', 'Beata', -20), row('3', 'Celina', 0), row('4', 'Darek', -100), row('5', 'Ela', 100)]

describe('getBalanceSummary', () => {
  describe('filtr "all"', () => {
    it('pusta lista → totalCount 0, netSum 0', () => {
      expect(getBalanceSummary(EMPTY, 'all')).toEqual({ filter: 'all', totalCount: 0, netSum: 0 })
    })

    it('same dodatnie → netSum to suma wszystkich', () => {
      expect(getBalanceSummary(ALL_POSITIVE, 'all')).toEqual({ filter: 'all', totalCount: 3, netSum: 65 })
    })

    it('same ujemne → netSum to suma wszystkich (ujemna)', () => {
      expect(getBalanceSummary(ALL_NEGATIVE, 'all')).toEqual({ filter: 'all', totalCount: 3, netSum: -115 })
    })

    it('same zera → netSum 0, ale totalCount liczy wszystkich znajomych', () => {
      expect(getBalanceSummary(ALL_ZERO, 'all')).toEqual({ filter: 'all', totalCount: 2, netSum: 0 })
    })

    it('mix → netSum to dodatnie minus ujemne (suma wszystkich sald)', () => {
      // 30 - 20 + 0 - 100 + 100 = 10
      expect(getBalanceSummary(MIX, 'all')).toEqual({ filter: 'all', totalCount: 5, netSum: 10 })
    })
  })

  describe('filtr "positive"', () => {
    it('pusta lista → filteredCount 0, sum 0', () => {
      expect(getBalanceSummary(EMPTY, 'positive')).toEqual({ filter: 'positive', totalCount: 0, filteredCount: 0, sum: 0 })
    })

    it('same dodatnie → filteredCount = totalCount', () => {
      expect(getBalanceSummary(ALL_POSITIVE, 'positive')).toEqual({ filter: 'positive', totalCount: 3, filteredCount: 3, sum: 65 })
    })

    it('same ujemne → filteredCount 0, sum 0, ale totalCount policzony z pełnej listy (nie z przefiltrowanej)', () => {
      expect(getBalanceSummary(ALL_NEGATIVE, 'positive')).toEqual({ filter: 'positive', totalCount: 3, filteredCount: 0, sum: 0 })
    })

    it('same zera → filteredCount 0, sum 0', () => {
      expect(getBalanceSummary(ALL_ZERO, 'positive')).toEqual({ filter: 'positive', totalCount: 2, filteredCount: 0, sum: 0 })
    })

    it('mix → totalCount to WSZYSCY znajomi, filteredCount tylko dodatni — te dwie liczby muszą się różnić', () => {
      const result = getBalanceSummary(MIX, 'positive')
      expect(result).toEqual({ filter: 'positive', totalCount: 5, filteredCount: 2, sum: 130 })
      if (result.filter !== 'positive') throw new Error('unreachable')
      expect(result.totalCount).not.toBe(result.filteredCount)
    })
  })

  describe('filtr "negative"', () => {
    it('pusta lista → filteredCount 0, sum 0', () => {
      expect(getBalanceSummary(EMPTY, 'negative')).toEqual({ filter: 'negative', totalCount: 0, filteredCount: 0, sum: 0 })
    })

    it('same dodatnie → filteredCount 0, sum 0', () => {
      expect(getBalanceSummary(ALL_POSITIVE, 'negative')).toEqual({ filter: 'negative', totalCount: 3, filteredCount: 0, sum: 0 })
    })

    it('same ujemne → filteredCount = totalCount, sum ujemna', () => {
      expect(getBalanceSummary(ALL_NEGATIVE, 'negative')).toEqual({ filter: 'negative', totalCount: 3, filteredCount: 3, sum: -115 })
    })

    it('mix → totalCount to WSZYSCY znajomi, filteredCount tylko ujemni', () => {
      expect(getBalanceSummary(MIX, 'negative')).toEqual({ filter: 'negative', totalCount: 5, filteredCount: 2, sum: -120 })
    })
  })

  describe('filtr "zero"', () => {
    it('pusta lista → filteredCount 0', () => {
      expect(getBalanceSummary(EMPTY, 'zero')).toEqual({ filter: 'zero', totalCount: 0, filteredCount: 0 })
    })

    it('same zera → filteredCount = totalCount', () => {
      expect(getBalanceSummary(ALL_ZERO, 'zero')).toEqual({ filter: 'zero', totalCount: 2, filteredCount: 2 })
    })

    it('brak zer w mixie → filteredCount mniejszy niż totalCount', () => {
      expect(getBalanceSummary(MIX, 'zero')).toEqual({ filter: 'zero', totalCount: 5, filteredCount: 1 })
    })
  })
})

describe('getBalanceCounts', () => {
  it('liczy osobno dla każdej kategorii z mixu', () => {
    expect(getBalanceCounts(MIX)).toEqual({ all: 5, positive: 2, negative: 2, zero: 1 })
  })

  it('pusta lista → same zera', () => {
    expect(getBalanceCounts(EMPTY)).toEqual({ all: 0, positive: 0, negative: 0, zero: 0 })
  })
})

describe('filterBalanceRows', () => {
  it('"all" zwraca wszystkie wiersze bez zmian', () => {
    expect(filterBalanceRows(MIX, 'all')).toEqual(MIX)
  })

  it('"positive" zostawia tylko balance > 0', () => {
    expect(filterBalanceRows(MIX, 'positive').map(r => r.id)).toEqual(['1', '5'])
  })

  it('"negative" zostawia tylko balance < 0', () => {
    expect(filterBalanceRows(MIX, 'negative').map(r => r.id)).toEqual(['2', '4'])
  })

  it('"zero" zostawia tylko balance === 0', () => {
    expect(filterBalanceRows(MIX, 'zero').map(r => r.id)).toEqual(['3'])
  })
})

describe('sortBalanceRows', () => {
  it('"positive" sortuje malejąco', () => {
    expect(sortBalanceRows(ALL_POSITIVE, 'positive').map(r => r.balance)).toEqual([50, 10, 5])
  })

  it('"negative" sortuje rosnąco — największy dług (najmniejsza liczba) na górze', () => {
    const sorted = sortBalanceRows(ALL_NEGATIVE, 'negative')
    expect(sorted.map(r => r.balance)).toEqual([-100, -10, -5])
    // -100 to większy dług niż -10, mimo że "rosnąco" brzmi odwrotnie
    expect(sorted[0].balance).toBeLessThan(sorted[1].balance)
  })

  it('"zero" sortuje alfabetycznie po nicku', () => {
    const rows = [row('1', 'Zenon', 0), row('2', 'Ala', 0), row('3', 'Marek', 0)]
    expect(sortBalanceRows(rows, 'zero').map(r => r.nick)).toEqual(['Ala', 'Marek', 'Zenon'])
  })

  it('"all" grupuje: dodatnie malejąco → ujemne rosnąco → zera alfabetycznie', () => {
    const sorted = sortBalanceRows(MIX, 'all')
    expect(sorted.map(r => r.id)).toEqual(['5', '1', '4', '2', '3'])
    // 5=100, 1=30 (dodatnie malejąco), 4=-100, 2=-20 (ujemne rosnąco/dług malejący), 3=0 (zero na końcu)
  })

  it('pusta lista dla każdego filtra nie wywala się i zwraca []', () => {
    expect(sortBalanceRows(EMPTY, 'all')).toEqual([])
    expect(sortBalanceRows(EMPTY, 'positive')).toEqual([])
    expect(sortBalanceRows(EMPTY, 'negative')).toEqual([])
    expect(sortBalanceRows(EMPTY, 'zero')).toEqual([])
  })
})
