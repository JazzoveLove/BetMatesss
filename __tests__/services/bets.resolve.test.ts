import { chainResponse } from '../helpers/supabaseMock'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

jest.mock('@/features/settlements', () => ({
  createSettlements: jest.fn().mockResolvedValue({}),
}))

import { supabase } from '@/shared/lib/supabase'
import { createSettlements } from '@/features/settlements'
import {
  submitBetResult,
  confirmBetResult,
  disputeBetResult,
} from '@/features/bets/api/bets.resolve.results'

const mockFrom = supabase.from as jest.Mock
const mockCreateSettlements = createSettlements as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
  mockCreateSettlements.mockReset()
  mockCreateSettlements.mockResolvedValue({})
})

describe('submitBetResult', () => {
  it('zwraca błąd dla zakładu w formacie per_match (nie wolno tą drogą)', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: { format: 'per_match' }, error: null }))

    const result = await submitBetResult({
      betId: 'bet-1',
      winnerId: 'user-1',
      score: '11:7',
      recordedBy: 'user-1',
    })

    expect(result.error).toBeDefined()
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('przechodzi dla zakładu w formacie single', async () => {
    const betsSelectChain = chainResponse({ data: { format: 'single' }, error: null })
    const resultsInsertChain = chainResponse({ data: null, error: null })
    const betsUpdateChain = chainResponse({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(betsSelectChain)
      .mockReturnValueOnce(resultsInsertChain)
      .mockReturnValueOnce(betsUpdateChain)

    const result = await submitBetResult({
      betId: 'bet-1',
      winnerId: 'user-1',
      score: '11:7',
      recordedBy: 'user-1',
    })

    expect(result).toEqual({})
  })

  it('po udanym zapisie wyniku ustawia status zakładu na awaiting_confirmation', async () => {
    const betsSelectChain = chainResponse({ data: { format: 'single' }, error: null })
    const resultsInsertChain = chainResponse({ data: null, error: null })
    const betsUpdateChain = chainResponse({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(betsSelectChain)
      .mockReturnValueOnce(resultsInsertChain)
      .mockReturnValueOnce(betsUpdateChain)

    await submitBetResult({
      betId: 'bet-1',
      winnerId: 'user-1',
      score: '11:7',
      recordedBy: 'user-1',
    })

    expect(betsUpdateChain.update).toHaveBeenCalledWith({ status: 'awaiting_confirmation' })
  })
})

describe('confirmBetResult', () => {
  it('ustawia confirmed na wyniku i status completed na zakładzie', async () => {
    const resultsUpdateChain = chainResponse({ data: null, error: null })
    const betsUpdateChain = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(resultsUpdateChain).mockReturnValueOnce(betsUpdateChain)

    const result = await confirmBetResult({ betId: 'bet-1', resultId: 'res-1', confirmerId: 'user-2' })

    expect(resultsUpdateChain.update).toHaveBeenCalledWith({
      confirmed: true,
      confirmed_by: 'user-2',
    })
    expect(betsUpdateChain.update).toHaveBeenCalledWith({ status: 'completed' })
    expect(result).toEqual({})
  })

  it('zwraca błąd gdy update bet_results się nie powiedzie', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: { message: 'update failed' } }))

    const result = await confirmBetResult({ betId: 'bet-1', resultId: 'res-1', confirmerId: 'user-2' })

    expect(result).toEqual({ error: 'update failed' })
    expect(mockCreateSettlements).not.toHaveBeenCalled()
  })
})

describe('disputeBetResult', () => {
  it('ustawia status disputed', async () => {
    const chain = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(chain)

    const result = await disputeBetResult('bet-1')

    expect(chain.update).toHaveBeenCalledWith({ status: 'disputed' })
    expect(result).toEqual({})
  })
})
