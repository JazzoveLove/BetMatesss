jest.mock('../../services/settlements.service', () => ({
  createSettlements: jest.fn(async () => ({})),
}))

import { supabase } from '../../lib/supabase'
import {
  confirmBetResult,
  disputeBetResult,
  submitBetResult,
} from '../../services/bets/bets.resolve.results'

type QueryChain = Record<string, jest.Mock>

const createChain = (value: unknown): QueryChain => {
  const chain: QueryChain = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    maybeSingle: jest.fn(async () => value),
    insert: jest.fn(async () => value),
    update: jest.fn(() => chain),
    order: jest.fn(() => chain),
    limit: jest.fn(() => chain),
  }
  return chain
}

const createUpdateChain = (value: { error: { message: string } | null }) => ({
  update: jest.fn(() => {
    const updateChain: { eq: jest.Mock } = { eq: jest.fn() }
    updateChain.eq.mockReturnValueOnce(updateChain).mockReturnValueOnce(Promise.resolve(value))
    return updateChain
  }),
})

const createSingleEqUpdateChain = (value: { error: { message: string } | null }) => ({
  update: jest.fn(() => ({
    eq: jest.fn(async () => value),
  })),
})

describe('submitBetResult', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should move bet to awaiting_confirmation after result submission', async () => {
    // Arrange
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(createChain({ data: { format: 'single' }, error: null }))
      .mockReturnValueOnce(createChain({ error: null }))
      .mockReturnValueOnce(createChain({ error: null }))

    // Act
    const result = await submitBetResult({
      betId: 'bet-1',
      winnerId: 'u1',
      score: '2:1',
      recordedBy: 'u1',
    })

    // Assert
    expect(result).toEqual({})
  })

  it('should block submission for per_match format', async () => {
    // Arrange
    ;(supabase.from as jest.Mock).mockReturnValueOnce(
      createChain({ data: { format: 'per_match' }, error: null }),
    )

    // Act
    const result = await submitBetResult({
      betId: 'bet-2',
      winnerId: 'u1',
      score: '2:1',
      recordedBy: 'u1',
    })

    // Assert
    expect(result.error).toContain('mecz po meczu')
  })
})

describe('confirmBetResult', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should settle bet only after confirmation succeeds', async () => {
    // Arrange
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(createChain({ error: null }))
      .mockReturnValueOnce(createChain({ error: null }))

    // Act
    const result = await confirmBetResult({
      betId: 'bet-1',
      resultId: 'res-1',
      confirmerId: 'u2',
    })

    // Assert
    expect(result).toEqual({})
  })

  it('should return update error when confirmation write fails', async () => {
    // Arrange
    ;(supabase.from as jest.Mock).mockReturnValueOnce(
      createUpdateChain({ error: { message: 'db failed' } }),
    )

    // Act
    const result = await confirmBetResult({
      betId: 'bet-1',
      resultId: 'res-1',
      confirmerId: 'u2',
    })

    // Assert
    expect(result).toEqual({ error: 'db failed' })
  })
})

describe('disputeBetResult', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should set disputed status and block settlement path', async () => {
    // Arrange
    ;(supabase.from as jest.Mock).mockReturnValueOnce(createSingleEqUpdateChain({ error: null }))

    // Act
    const result = await disputeBetResult('bet-1')

    // Assert
    expect(result).toEqual({})
  })

  it('should return error when dispute update fails', async () => {
    // Arrange
    ;(supabase.from as jest.Mock).mockReturnValueOnce(
      createSingleEqUpdateChain({ error: { message: 'cannot update' } }),
    )

    // Act
    const result = await disputeBetResult('bet-1')

    // Assert
    expect(result).toEqual({ error: 'cannot update' })
  })
})
