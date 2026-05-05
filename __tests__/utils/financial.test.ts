import { balanceHighlight, formatBalance } from '../../utils/settlements'
import { buildRivalryTotalsFromMatches } from '../../services/rivalry/mapRivalryItems'
import type { RivalryMatchItem } from '../../services/rivalry/rivalry.types'

describe('formatBalance', () => {
  it('should format positive amount with plus sign and currency suffix', () => {
    // Arrange
    const amount = 50

    // Act
    const result = formatBalance(amount)

    // Assert
    expect(result).toBe('+50 zł')
  })

  it('should format negative amount with minus sign and currency suffix', () => {
    // Arrange
    const amount = -20

    // Act
    const result = formatBalance(amount)

    // Assert
    expect(result).toBe('-20 zł')
  })

  it('should format zero amount without plus sign', () => {
    // Arrange
    const amount = 0

    // Act
    const result = formatBalance(amount)

    // Assert
    expect(result).toBe('0 zł')
  })

  it('should preserve decimal values', () => {
    // Arrange
    const amount = 12.5

    // Act
    const result = formatBalance(amount)

    // Assert
    expect(result).toBe('+12.5 zł')
  })

  it('should return readable output for NaN input', () => {
    // Arrange
    const amount = Number.NaN

    // Act
    const result = formatBalance(amount)

    // Assert
    expect(result).toBe('NaN zł')
  })
})

describe('balanceHighlight', () => {
  it('should return positive for amounts above zero', () => {
    // Arrange
    const amount = 1

    // Act
    const result = balanceHighlight(amount)

    // Assert
    expect(result).toBe('positive')
  })

  it('should return negative for amounts below zero', () => {
    // Arrange
    const amount = -1

    // Act
    const result = balanceHighlight(amount)

    // Assert
    expect(result).toBe('negative')
  })

  it('should return neutral for zero', () => {
    // Arrange
    const amount = 0

    // Act
    const result = balanceHighlight(amount)

    // Assert
    expect(result).toBe('neutral')
  })

  it('should return neutral for negative zero', () => {
    // Arrange
    const amount = -0

    // Act
    const result = balanceHighlight(amount)

    // Assert
    expect(result).toBe('neutral')
  })

  it('should return neutral for NaN', () => {
    // Arrange
    const amount = Number.NaN

    // Act
    const result = balanceHighlight(amount)

    // Assert
    expect(result).toBe('neutral')
  })
})

describe('buildRivalryTotalsFromMatches (winrate calculation)', () => {
  const makeMatch = (overrides: Partial<RivalryMatchItem>): RivalryMatchItem => ({
    betId: 'b1',
    rivalryId: 'r1',
    gameTemplate: 'fifa',
    createdAt: '2026-01-01T00:00:00.000Z',
    score: '1:0',
    stakeAmount: 50,
    profit: 0,
    outcome: 'draw',
    ...overrides,
  })

  it('should calculate correct rounded winrate percentage', () => {
    // Arrange
    const matches = [
      makeMatch({ outcome: 'win', profit: 50 }),
      makeMatch({ betId: 'b2', outcome: 'win', profit: 30 }),
      makeMatch({ betId: 'b3', outcome: 'loss', profit: -20 }),
    ]

    // Act
    const totals = buildRivalryTotalsFromMatches(matches)

    // Assert
    expect(totals.winRatePct).toBe(67)
    expect(totals.wins).toBe(2)
    expect(totals.losses).toBe(1)
  })

  it('should return zero winrate when there are no wins/losses', () => {
    // Arrange
    const matches = [makeMatch({ outcome: 'draw' }), makeMatch({ betId: 'b2', outcome: 'draw' })]

    // Act
    const totals = buildRivalryTotalsFromMatches(matches)

    // Assert
    expect(totals.winRatePct).toBe(0)
    expect(totals.wins).toBe(0)
    expect(totals.losses).toBe(0)
  })
})
