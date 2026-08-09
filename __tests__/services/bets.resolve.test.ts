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
  canConfirmResult,
} from '@/features/bets/api/bets.resolve.results'

const mockFrom = supabase.from as jest.Mock
const mockRpc = supabase.rpc as jest.Mock
const mockCreateSettlements = createSettlements as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
  mockRpc.mockReset()
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
    mockFrom.mockReturnValueOnce(betsSelectChain)
    mockRpc.mockResolvedValueOnce({ data: null, error: null })

    const result = await submitBetResult({
      betId: 'bet-1',
      winnerId: 'user-1',
      score: '11:7',
      recordedBy: 'user-1',
    })

    expect(mockRpc).toHaveBeenCalledWith('submit_bet_result', {
      p_bet_id: 'bet-1',
      p_winner_id: 'user-1',
      p_score: '11:7',
      p_recorded_by: 'user-1',
    })
    expect(result).toEqual({})
  })

  it('zwraca czytelny błąd, gdy RPC zgłasza konflikt unikalności (23505)', async () => {
    const betsSelectChain = chainResponse({ data: { format: 'single' }, error: null })
    mockFrom.mockReturnValueOnce(betsSelectChain)
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'duplicate key' } })

    const result = await submitBetResult({
      betId: 'bet-1',
      winnerId: 'user-1',
      score: '11:7',
      recordedBy: 'user-1',
    })

    expect(result).toEqual({ error: 'Ktoś już wpisał wynik dla tego zakładu — odśwież ekran.' })
  })

  it('przekazuje surowy komunikat błędu RPC dla innych kodów', async () => {
    const betsSelectChain = chainResponse({ data: { format: 'single' }, error: null })
    mockFrom.mockReturnValueOnce(betsSelectChain)
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: '500', message: 'boom' } })

    const result = await submitBetResult({
      betId: 'bet-1',
      winnerId: 'user-1',
      score: '11:7',
      recordedBy: 'user-1',
    })

    expect(result).toEqual({ error: 'boom' })
  })
})

describe('confirmBetResult', () => {
  it('ustawia confirmed na wyniku i status completed na zakładzie', async () => {
    const fetchChain = chainResponse({ data: { recorded_by: 'user-1' }, error: null })
    const resultsUpdateChain = chainResponse({ data: [{ id: 'res-1' }], error: null })
    const betsUpdateChain = chainResponse({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(fetchChain)
      .mockReturnValueOnce(resultsUpdateChain)
      .mockReturnValueOnce(betsUpdateChain)

    const result = await confirmBetResult({ betId: 'bet-1', resultId: 'res-1', confirmerId: 'user-2' })

    expect(resultsUpdateChain.update).toHaveBeenCalledWith({
      confirmed: true,
      confirmed_by: 'user-2',
    })
    expect(betsUpdateChain.update).toHaveBeenCalledWith({ status: 'completed' })
    expect(result).toEqual({})
  })

  it('zwraca błąd gdy update bet_results się nie powiedzie', async () => {
    const fetchChain = chainResponse({ data: { recorded_by: 'user-1' }, error: null })
    mockFrom
      .mockReturnValueOnce(fetchChain)
      .mockReturnValueOnce(chainResponse({ data: null, error: { message: 'update failed' } }))

    const result = await confirmBetResult({ betId: 'bet-1', resultId: 'res-1', confirmerId: 'user-2' })

    expect(result).toEqual({ error: 'update failed' })
    expect(mockCreateSettlements).not.toHaveBeenCalled()
  })

  it('zwraca błąd gdy wynik został już rozstrzygnięty przez kogoś innego (race)', async () => {
    const fetchChain = chainResponse({ data: { recorded_by: 'user-1' }, error: null })
    mockFrom
      .mockReturnValueOnce(fetchChain)
      .mockReturnValueOnce(chainResponse({ data: [], error: null }))

    const result = await confirmBetResult({ betId: 'bet-1', resultId: 'res-1', confirmerId: 'user-2' })

    expect(result).toEqual({ error: 'Ten wynik został już rozstrzygnięty.' })
    expect(mockCreateSettlements).not.toHaveBeenCalled()
  })

  it('odrzuca potwierdzenie własnego wyniku (confirmerId === recorded_by)', async () => {
    const fetchChain = chainResponse({ data: { recorded_by: 'user-2' }, error: null })
    mockFrom.mockReturnValueOnce(fetchChain)

    const result = await confirmBetResult({ betId: 'bet-1', resultId: 'res-1', confirmerId: 'user-2' })

    expect(result).toEqual({ error: 'Nie możesz potwierdzić własnego wyniku — musi to zrobić druga strona.' })
    expect(mockFrom).toHaveBeenCalledTimes(1)
    expect(mockCreateSettlements).not.toHaveBeenCalled()
  })

  it('zwraca błąd gdy nie znaleziono oczekującego wyniku', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    const result = await confirmBetResult({ betId: 'bet-1', resultId: 'res-1', confirmerId: 'user-2' })

    expect(result).toEqual({ error: 'Nie znaleziono wyniku do potwierdzenia.' })
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('zwraca błąd gdy pobranie recorded_by się nie powiedzie', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: { message: 'fetch failed' } }))

    const result = await confirmBetResult({ betId: 'bet-1', resultId: 'res-1', confirmerId: 'user-2' })

    expect(result).toEqual({ error: 'fetch failed' })
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })
})

describe('canConfirmResult', () => {
  const basePending = {
    id: 'res-1',
    winnerId: 'user-1',
    score: '11:7',
    recordedBy: 'user-1',
    confirmed: false,
  }

  it('zwraca false dla osoby, która wpisała wynik', () => {
    expect(canConfirmResult(basePending, 'user-1')).toBe(false)
  })

  it('zwraca true dla drugiej strony', () => {
    expect(canConfirmResult(basePending, 'user-2')).toBe(true)
  })

  it('zwraca false gdy nie ma oczekującego wyniku', () => {
    expect(canConfirmResult(null, 'user-2')).toBe(false)
  })
})

describe('disputeBetResult', () => {
  it('ustawia status disputed', async () => {
    const chain = chainResponse({ data: [{ id: 'bet-1' }], error: null })
    mockFrom.mockReturnValueOnce(chain)

    const result = await disputeBetResult('bet-1')

    expect(chain.update).toHaveBeenCalledWith({ status: 'disputed' })
    expect(result).toEqual({})
  })

  it('zwraca błąd, gdy zakład nie czeka już na potwierdzenie (np. już completed)', async () => {
    const chain = chainResponse({ data: [], error: null })
    mockFrom.mockReturnValueOnce(chain)

    const result = await disputeBetResult('bet-1')

    expect(result).toEqual({ error: 'Nie można zgłosić sporu — zakład nie czeka już na potwierdzenie.' })
  })

  it('zwraca błąd bazy, gdy update się nie powiedzie', async () => {
    const chain = chainResponse({ data: null, error: { message: 'db down' } })
    mockFrom.mockReturnValueOnce(chain)

    const result = await disputeBetResult('bet-1')

    expect(result).toEqual({ error: 'db down' })
  })
})
