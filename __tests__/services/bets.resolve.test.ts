import { chainResponse } from '../helpers/supabaseMock'

jest.mock('../../lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

jest.mock('../../services/settlements.service', () => ({
  createSettlements: jest.fn().mockResolvedValue({}),
}))

import { supabase } from '../../lib/supabase'
import { createSettlements } from '../../services/settlements.service'
import {
  submitBetResult,
  confirmBetResult,
  disputeBetResult,
} from '../../services/bets/bets.resolve.results'

const mockFrom = supabase.from as jest.Mock
const mockCreateSettlements = createSettlements as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
  mockCreateSettlements.mockReset()
  mockCreateSettlements.mockResolvedValue({})
})

describe('submitBetResult', () => {
  it('zwraca błąd dla zakładu w formacie per_match (nie wolno tą drogą)', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(chainResponse({ data: { format: 'per_match' }, error: null }))

    // Act
    const result = await submitBetResult({
      betId: 'bet-1',
      winnerId: 'user-1',
      score: '11:7',
      recordedBy: 'user-1',
    })

    // Assert
    expect(result.error).toBeDefined()
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('przechodzi dla zakładu w formacie single', async () => {
    // Arrange
    const betsSelectChain = chainResponse({ data: { format: 'single' }, error: null })
    const resultsInsertChain = chainResponse({ data: null, error: null })
    const betsUpdateChain = chainResponse({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(betsSelectChain)
      .mockReturnValueOnce(resultsInsertChain)
      .mockReturnValueOnce(betsUpdateChain)

    // Act
    const result = await submitBetResult({
      betId: 'bet-1',
      winnerId: 'user-1',
      score: '11:7',
      recordedBy: 'user-1',
    })

    // Assert
    expect(result).toEqual({})
  })

  it('po udanym zapisie wyniku ustawia status zakładu na awaiting_confirmation', async () => {
    // Arrange
    const betsSelectChain = chainResponse({ data: { format: 'single' }, error: null })
    const resultsInsertChain = chainResponse({ data: null, error: null })
    const betsUpdateChain = chainResponse({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(betsSelectChain)
      .mockReturnValueOnce(resultsInsertChain)
      .mockReturnValueOnce(betsUpdateChain)

    // Act
    await submitBetResult({
      betId: 'bet-1',
      winnerId: 'user-1',
      score: '11:7',
      recordedBy: 'user-1',
    })

    // Assert
    expect(betsUpdateChain.update).toHaveBeenCalledWith({ status: 'awaiting_confirmation' })
  })
})

describe('confirmBetResult', () => {
  it('ustawia confirmed na wyniku i status completed na zakładzie', async () => {
    // Arrange
    const resultsUpdateChain = chainResponse({ data: null, error: null })
    const betsUpdateChain = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(resultsUpdateChain).mockReturnValueOnce(betsUpdateChain)

    // Act
    const result = await confirmBetResult({ betId: 'bet-1', resultId: 'res-1', confirmerId: 'user-2' })

    // Assert
    expect(resultsUpdateChain.update).toHaveBeenCalledWith({
      confirmed: true,
      confirmed_by: 'user-2',
    })
    expect(betsUpdateChain.update).toHaveBeenCalledWith({ status: 'completed' })
    expect(result).toEqual({})
  })

  it('zwraca błąd gdy update bet_results się nie powiedzie', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: { message: 'update failed' } }))

    // Act
    const result = await confirmBetResult({ betId: 'bet-1', resultId: 'res-1', confirmerId: 'user-2' })

    // Assert
    expect(result).toEqual({ error: 'update failed' })
    expect(mockCreateSettlements).not.toHaveBeenCalled()
  })
})

describe('disputeBetResult', () => {
  it('ustawia status disputed', async () => {
    // Arrange
    const chain = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(chain)

    // Act
    const result = await disputeBetResult('bet-1')

    // Assert
    expect(chain.update).toHaveBeenCalledWith({ status: 'disputed' })
    expect(result).toEqual({})
  })
})
