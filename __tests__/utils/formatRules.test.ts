import { calculatePerMatchBalance, getAvailableFormats, getDefaultFormat } from '../../utils/formats'

describe('getAvailableFormats', () => {
  const game = {
    id: 'fifa',
    name: 'FIFA',
    category: 'video',
    icon: 'x',
    defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'per_match', 'round_robin', 'elimination'],
  } as const

  it('should include elimination when there are at least four players', () => {
    // Arrange
    const participants = 3

    // Act
    const result = getAvailableFormats(game as never, participants)

    // Assert
    expect(result).toContain('elimination')
  })

  it('should exclude round_robin when there are fewer than three total players', () => {
    // Arrange
    const participants = 1

    // Act
    const result = getAvailableFormats(game as never, participants)

    // Assert
    expect(result).not.toContain('round_robin')
  })
})

describe('getDefaultFormat', () => {
  const game = {
    id: 'fifa',
    name: 'FIFA',
    category: 'video',
    icon: 'x',
    defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'per_match', 'round_robin', 'elimination'],
  } as const

  it('should default to elimination when player count reaches tournament threshold', () => {
    // Arrange
    const participants = 3

    // Act
    const result = getDefaultFormat(game as never, participants)

    // Assert
    expect(result).toBe('elimination')
  })

  it('should default to round_robin when exactly three players are present', () => {
    // Arrange
    const participants = 2

    // Act
    const result = getDefaultFormat(game as never, participants)

    // Assert
    expect(result).toBe('round_robin')
  })

  it('should keep game default for two-player matches', () => {
    // Arrange
    const participants = 1

    // Act
    const result = getDefaultFormat(game as never, participants)

    // Assert
    expect(result).toBe('single')
  })
})

describe('calculatePerMatchBalance', () => {
  const participants = [
    { id: 'u1', nick: 'A', stakeAmount: 10, odds: 2, role: 'creator', confirmed: true },
    { id: 'u2', nick: 'B', stakeAmount: 10, odds: 2, role: 'participant', confirmed: true },
  ] as const

  it('should settle each confirmed match independently in per_match format', () => {
    // Arrange
    const results = [
      { winner_id: 'u1', confirmed: true },
      { winner_id: 'u2', confirmed: true },
      { winner_id: 'u1', confirmed: true },
    ] as never[]

    // Act
    const balance = calculatePerMatchBalance(results, 10, participants as never)

    // Assert
    expect(balance).toEqual({ u1: 10, u2: -10 })
  })

  it('should ignore unconfirmed results', () => {
    // Arrange
    const results = [
      { winner_id: 'u1', confirmed: true },
      { winner_id: 'u1', confirmed: false },
    ] as never[]

    // Act
    const balance = calculatePerMatchBalance(results, 10, participants as never)

    // Assert
    expect(balance).toEqual({ u1: 10, u2: -10 })
  })

  it('should return zero balances when stake per match is invalid', () => {
    // Arrange
    const results = [{ winner_id: 'u1', confirmed: true }] as never[]

    // Act
    const balance = calculatePerMatchBalance(results, 0, participants as never)

    // Assert
    expect(balance).toEqual({ u1: 0, u2: 0 })
  })
})

// TODO: align with implementation when created
describe('format-specific tournament rules not yet implemented as pure helpers', () => {
  it('should track best_of_N winner as first to ceil(N/2) wins', () => {
    // Arrange
    const winsNeeded = Math.ceil(5 / 2)
    const wins = { u1: 3, u2: 1 }

    // Act
    const winner = wins.u1 >= winsNeeded ? 'u1' : 'u2'

    // Assert
    expect(winner).toBe('u1')
  })

  it('should rank round_robin by wins and keep ties grouped', () => {
    // Arrange
    const table = [
      { id: 'u1', wins: 2 },
      { id: 'u2', wins: 2 },
      { id: 'u3', wins: 1 },
    ]

    // Act
    const leaders = table.filter(row => row.wins === Math.max(...table.map(row => row.wins)))

    // Assert
    expect(leaders.map(row => row.id)).toEqual(['u1', 'u2'])
  })
})
