import { parseStakeAmount, toStakeNumber, calcOdds } from './odds'

// ─── parseStakeAmount ─────────────────────────────────────────────────────────

describe('parseStakeAmount', () => {
  describe('liczby', () => {
    it('zwraca liczbę gdy dostanie liczbę', () => {
      expect(parseStakeAmount(10)).toBe(10)
    })

    it('zwraca liczbę dziesiętną', () => {
      expect(parseStakeAmount(10.5)).toBe(10.5)
    })

    it('zwraca 0 dla Infinity', () => {
      expect(parseStakeAmount(Infinity)).toBe(0)
    })
  })

  describe('stringi', () => {
    it('parsuje string z kropką', () => {
      expect(parseStakeAmount('10.50')).toBe(10.5)
    })

    it('parsuje string z przecinkiem (format polski)', () => {
      expect(parseStakeAmount('10,50')).toBe(10.5)
    })

    it('ignoruje białe znaki', () => {
      expect(parseStakeAmount('  100  ')).toBe(100)
    })

    it('zwraca 0 dla pustego stringa', () => {
      expect(parseStakeAmount('')).toBe(0)
    })

    it('zwraca 0 dla tekstu nie będącego liczbą', () => {
      expect(parseStakeAmount('abc')).toBe(0)
    })
  })

  describe('wartości puste', () => {
    it('zwraca 0 dla null', () => {
      expect(parseStakeAmount(null)).toBe(0)
    })

    it('zwraca 0 dla undefined', () => {
      expect(parseStakeAmount(undefined)).toBe(0)
    })
  })
})

// ─── toStakeNumber ────────────────────────────────────────────────────────────

describe('toStakeNumber', () => {
  it('zaokrągla do 2 miejsc po przecinku', () => {
    expect(toStakeNumber('10.555')).toBe(10.56)
  })

  it('zwraca 0 dla wartości ujemnej', () => {
    expect(toStakeNumber(-5)).toBe(0)
  })

  it('zwraca 0 dla null', () => {
    expect(toStakeNumber(null)).toBe(0)
  })

  it('przepuszcza całkowitą kwotę bez zmian', () => {
    expect(toStakeNumber(100)).toBe(100)
  })
})

// ─── calcOdds ─────────────────────────────────────────────────────────────────

describe('calcOdds', () => {
  describe('tryb none', () => {
    it('zawsze zwraca 0', () => {
      const players = [{ customStake: 100 }, { customStake: 100 }]
      expect(calcOdds(100, players, 100, 'none')).toBe(0)
    })
  })

  describe('tryb equal', () => {
    it('2 graczy po 100 zł → kurs 2.0', () => {
      const players = [{ customStake: 100 }, { customStake: 100 }]
      expect(calcOdds(100, players, 100, 'equal')).toBe(2)
    })

    it('3 graczy po 50 zł → kurs 3.0', () => {
      const players = [
        { customStake: 50 },
        { customStake: 50 },
        { customStake: 50 },
      ]
      expect(calcOdds(50, players, 50, 'equal')).toBe(3)
    })

    it('stawka 0 → kurs 0 (ochrona przed dzieleniem przez zero)', () => {
      const players = [{ customStake: 0 }, { customStake: 0 }]
      expect(calcOdds(0, players, 0, 'equal')).toBe(0)
    })
  })

  describe('tryb custom', () => {
    it('25 vs 75 zł → kurs 4.0 dla gracza z stawką 25', () => {
      const players = [{ customStake: 25 }, { customStake: 75 }]
      expect(calcOdds(25, players, 0, 'custom')).toBe(4)
    })

    it('25 vs 75 zł → kurs 1.33 dla gracza z stawką 75', () => {
      const players = [{ customStake: 25 }, { customStake: 75 }]
      expect(calcOdds(75, players, 0, 'custom')).toBe(1.33)
    })

    it('stawka uczestnika 0 → kurs 0 (ochrona przed dzieleniem przez zero)', () => {
      const players = [{ customStake: 0 }, { customStake: 100 }]
      expect(calcOdds(0, players, 0, 'custom')).toBe(0)
    })
  })
})
