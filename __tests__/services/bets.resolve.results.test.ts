import { chainResponse } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import { createSettlements } from '@/features/settlements'
import {
  cancelDisputedBet,
  confirmBetResult,
  getPendingBetResult,
} from '@/features/bets/api/bets.resolve.results'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

jest.mock('@/features/settlements', () => ({
  createSettlements: jest.fn().mockResolvedValue({}),
}))

const mockFrom = supabase.from as jest.Mock
const mockCreateSettlements = createSettlements as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
  mockCreateSettlements.mockReset()
  mockCreateSettlements.mockResolvedValue({})
})

describe('cancelDisputedBet', () => {
  it('sukces → update({status: "cancelled"}), {}', async () => {
    const chain = chainResponse({ data: [{ id: 'bet-1' }], error: null })
    mockFrom.mockReturnValueOnce(chain)

    const result = await cancelDisputedBet('bet-1')

    expect(chain.update).toHaveBeenCalledWith({ status: 'cancelled' })
    expect(result).toEqual({})
  })

  it('updatedRows puste → błąd guardu na .eq("status", "disputed")', async () => {
    const chain = chainResponse({ data: [], error: null })
    mockFrom.mockReturnValueOnce(chain)

    const result = await cancelDisputedBet('bet-1')

    expect(result).toEqual({ error: 'Nie można anulować — zakład nie jest już w sporze.' })
  })

  it('błąd bazy → propaguje error.message', async () => {
    const chain = chainResponse({ data: null, error: { message: 'db down' } })
    mockFrom.mockReturnValueOnce(chain)

    const result = await cancelDisputedBet('bet-1')

    expect(result).toEqual({ error: 'db down' })
  })
})

describe('confirmBetResult — dalsze przypadki', () => {
  it('update bets.status zwraca błąd → propaguje, createSettlements NIE jest wołane', async () => {
    const fetchChain = chainResponse({ data: { recorded_by: 'user-1' }, error: null })
    const resultsUpdateChain = chainResponse({ data: [{ id: 'res-1' }], error: null })
    const betsUpdateChain = chainResponse({ data: null, error: { message: 'bets update failed' } })
    mockFrom
      .mockReturnValueOnce(fetchChain)
      .mockReturnValueOnce(resultsUpdateChain)
      .mockReturnValueOnce(betsUpdateChain)

    const result = await confirmBetResult({ betId: 'bet-1', resultId: 'res-1', confirmerId: 'user-2' })

    expect(result).toEqual({ error: 'bets update failed' })
    expect(mockCreateSettlements).not.toHaveBeenCalled()
  })

  it('createSettlements zwraca {error} → ten sam błąd wraca na zewnątrz (nie połykamy go)', async () => {
    const fetchChain = chainResponse({ data: { recorded_by: 'user-1' }, error: null })
    const resultsUpdateChain = chainResponse({ data: [{ id: 'res-1' }], error: null })
    const betsUpdateChain = chainResponse({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(fetchChain)
      .mockReturnValueOnce(resultsUpdateChain)
      .mockReturnValueOnce(betsUpdateChain)
    mockCreateSettlements.mockResolvedValueOnce({ error: 'settlement failed' })

    const result = await confirmBetResult({ betId: 'bet-1', resultId: 'res-1', confirmerId: 'user-2' })

    expect(mockCreateSettlements).toHaveBeenCalledWith('bet-1')
    expect(result).toEqual({ error: 'settlement failed' })
  })
})

describe('getPendingBetResult', () => {
  it('mapuje wiersz na PendingBetResult (w tym scores.score → string)', async () => {
    const chain = chainResponse({
      data: {
        id: 'res-1',
        winner_id: 'user-1',
        scores: { score: '11:7' },
        recorded_by: 'user-1',
        confirmed: false,
      },
      error: null,
    })
    mockFrom.mockReturnValueOnce(chain)

    const result = await getPendingBetResult('bet-1')

    expect(result).toEqual({
      id: 'res-1',
      winnerId: 'user-1',
      score: '11:7',
      recordedBy: 'user-1',
      confirmed: false,
    })
  })

  it('error lub brak danych → null (nie rzuca)', async () => {
    const errChain = chainResponse({ data: null, error: { message: 'db error' } })
    mockFrom.mockReturnValueOnce(errChain)

    await expect(getPendingBetResult('bet-1')).resolves.toBeNull()

    const noDataChain = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(noDataChain)

    await expect(getPendingBetResult('bet-1')).resolves.toBeNull()
  })

  it('scores === null → score === "" (brak crasha na niepełnych danych)', async () => {
    const chain = chainResponse({
      data: {
        id: 'res-1',
        winner_id: 'user-1',
        scores: null,
        recorded_by: 'user-1',
        confirmed: false,
      },
      error: null,
    })
    mockFrom.mockReturnValueOnce(chain)

    const result = await getPendingBetResult('bet-1')

    expect(result?.score).toBe('')
  })
})
