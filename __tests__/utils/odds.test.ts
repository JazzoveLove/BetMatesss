import { parseStakeAmount, toStakeNumber, calcOdds } from '@/features/bets/utils/odds'

describe('parseStakeAmount', () => {
  it('null → 0', () => {
    expect(parseStakeAmount(null)).toBe(0)
  })

  it('undefined → 0', () => {
    expect(parseStakeAmount(undefined)).toBe(0)
  })

  it('liczba nieskończona (Infinity) → 0', () => {
    expect(parseStakeAmount(Infinity)).toBe(0)
  })

  it('NaN → 0', () => {
    expect(parseStakeAmount(NaN)).toBe(0)
  })

  it('string z przecinkiem dziesiętnym → liczba z kropką', () => {
    expect(parseStakeAmount('50,5')).toBe(50.5)
  })

  it('string ze spacjami (separator tysięcy) → liczba bez spacji', () => {
    expect(parseStakeAmount('1 000')).toBe(1000)
  })

  it('śmieciowy string → 0', () => {
    expect(parseStakeAmount('abc')).toBe(0)
  })
})

describe('toStakeNumber', () => {
  it('wartość ujemna → 0', () => {
    expect(toStakeNumber(-5)).toBe(0)
  })

  it('zaokrągla do najbliższej liczby całkowitej', () => {
    expect(toStakeNumber(50.6)).toBe(51)
    expect(toStakeNumber('50,4')).toBe(50)
  })
})

describe('calcOdds', () => {
  it('mode "none" → 0 niezależnie od stawek', () => {
    expect(calcOdds(100, [{ customStake: 100 }], 100, 'none')).toBe(0)
  })

  it('mode "equal" z globalStake = 0 → 0, nie NaN ani Infinity (dzielenie przez zero)', () => {
    const result = calcOdds(0, [{ customStake: 0 }, { customStake: 0 }], 0, 'equal')

    expect(result).toBe(0)
    expect(Number.isNaN(result)).toBe(false)
    expect(Number.isFinite(result)).toBe(true)
  })

  it('mode "custom" z participantStake = 0 → 0, nie NaN ani Infinity (dzielenie przez zero)', () => {
    const result = calcOdds(0, [{ customStake: 50 }, { customStake: 50 }], 0, 'custom')

    expect(result).toBe(0)
    expect(Number.isNaN(result)).toBe(false)
    expect(Number.isFinite(result)).toBe(true)
  })
})
