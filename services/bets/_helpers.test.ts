import { parseOddsNumber, normalizeUsersNick } from './_helpers'

// ─── parseOddsNumber ──────────────────────────────────────────────────────────

describe('parseOddsNumber', () => {
  it('zwraca liczbę gdy dostanie liczbę', () => {
    expect(parseOddsNumber(2.5)).toBe(2.5)
  })

  it('parsuje string z przecinkiem (format polski z bazy)', () => {
    expect(parseOddsNumber('2,5')).toBe(2.5)
  })

  it('parsuje string z kropką', () => {
    expect(parseOddsNumber('2.5')).toBe(2.5)
  })

  it('zwraca 0 dla undefined', () => {
    expect(parseOddsNumber(undefined)).toBe(0)
  })

  it('zwraca 0 dla Infinity', () => {
    expect(parseOddsNumber(Infinity)).toBe(0)
  })

  it('zwraca 0 dla tekstu nie będącego liczbą', () => {
    expect(parseOddsNumber('brak')).toBe(0)
  })
})

// ─── normalizeUsersNick ───────────────────────────────────────────────────────

describe('normalizeUsersNick', () => {
  describe('Supabase zwraca obiekt (jeden rekord)', () => {
    it('zwraca nick z obiektu', () => {
      expect(normalizeUsersNick({ nick: 'Maciek' })).toBe('Maciek')
    })

    it('zwraca null gdy nick jest pustym stringiem', () => {
      expect(normalizeUsersNick({ nick: '   ' })).toBeNull()
    })

    it('zwraca null gdy brak pola nick', () => {
      expect(normalizeUsersNick({})).toBeNull()
    })
  })

  describe('Supabase zwraca tablicę (join z wieloma wierszami)', () => {
    it('zwraca nick z pierwszego elementu tablicy', () => {
      expect(normalizeUsersNick([{ nick: 'Maciek' }, { nick: 'Ktoś' }])).toBe('Maciek')
    })

    it('zwraca null dla pustej tablicy', () => {
      expect(normalizeUsersNick([])).toBeNull()
    })

    it('zwraca null gdy nick w tablicy jest pusty', () => {
      expect(normalizeUsersNick([{ nick: '' }])).toBeNull()
    })
  })

  describe('wartości puste', () => {
    it('zwraca null dla null', () => {
      expect(normalizeUsersNick(null)).toBeNull()
    })

    it('zwraca null dla undefined', () => {
      expect(normalizeUsersNick(undefined)).toBeNull()
    })
  })
})
