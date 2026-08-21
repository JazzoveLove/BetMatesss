import { chainResponse, mockTable } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import { createSettlementsFromWinner } from '@/features/settlements/api/settlements.create.winner'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

const mockFrom = supabase.from as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
})

// Zapytanie o bet_results filtruje po bet_id + confirmed=true, sortuje malejąco
// po id i bierze pierwszy wiersz. Tam gdzie to ma znaczenie, testy poniżej
// dokładają "szum" (inny bet_id albo confirmed=false) i używają mockTable(),
// żeby realnie wykonać .eq()/.order()/.limit() na danych — zamiast z góry
// zaszywać gotową odpowiedź, która przeszłaby nawet gdyby kod w ogóle nie
// filtrował po confirmed.
describe('createSettlementsFromWinner', () => {
  it('brak potwierdzonego wyniku (resultRow === null) → błąd, żaden insert nie leci', async () => {
    const betResultsTable = mockTable([
      { id: 1, bet_id: 'bet-1', winner_id: 'user-1', confirmed: false },
      { id: 2, bet_id: 'bet-2', winner_id: 'user-2', confirmed: true },
    ])
    mockFrom.mockReturnValueOnce(betResultsTable)

    const result = await createSettlementsFromWinner('bet-1', [
      { user_id: 'user-1', stake_amount: 50 },
      { user_id: 'user-2', stake_amount: 50 },
    ])

    expect(result).toEqual({ error: 'Brak potwierdzonego wyniku ze zwycięzcą.' })
    expect(mockFrom).not.toHaveBeenCalledWith('settlements')
  })

  it('błąd bazy przy pobieraniu wyniku → propaguje błąd, brak insertu', async () => {
    const resultChain = chainResponse({ data: null, error: { message: 'DB error' } })
    mockFrom.mockReturnValueOnce(resultChain)

    const result = await createSettlementsFromWinner('bet-1', [
      { user_id: 'user-1', stake_amount: 50 },
      { user_id: 'user-2', stake_amount: 50 },
    ])

    expect(result).toEqual({ error: 'DB error' })
    expect(mockFrom).not.toHaveBeenCalledWith('settlements')
  })

  it('winner_id spoza listy uczestników → błąd, brak insertu', async () => {
    const betResultsTable = mockTable([{ id: 1, bet_id: 'bet-1', winner_id: 'user-99', confirmed: true }])
    mockFrom.mockReturnValueOnce(betResultsTable)

    const result = await createSettlementsFromWinner('bet-1', [
      { user_id: 'user-1', stake_amount: 50 },
      { user_id: 'user-2', stake_amount: 50 },
    ])

    expect(result).toEqual({ error: 'Zwycięzca nie jest uczestnikiem zakładu.' })
    expect(mockFrom).not.toHaveBeenCalledWith('settlements')
  })

  it('2 uczestników, zwycięzca user-1 → insert dokładnie jednego wiersza: debtor=user-2, creditor=user-1, amount=stawka przegranego', async () => {
    const betResultsTable = mockTable([
      // szum: wynik dla tego samego zakładu, ale niepotwierdzony — nie może wygrać
      { id: 1, bet_id: 'bet-1', winner_id: 'user-2', confirmed: false },
      { id: 2, bet_id: 'bet-1', winner_id: 'user-1', confirmed: true },
    ])
    const insertChain = chainResponse({ data: [{ id: 'settlement-1' }], error: null })
    mockFrom.mockReturnValueOnce(betResultsTable).mockReturnValueOnce(insertChain)

    const result = await createSettlementsFromWinner('bet-1', [
      { user_id: 'user-1', stake_amount: 30 },
      { user_id: 'user-2', stake_amount: 70 },
    ])

    expect(result).toEqual({})
    expect(insertChain.insert).toHaveBeenCalledWith([
      { bet_id: 'bet-1', debtor_id: 'user-2', creditor_id: 'user-1', amount: 70 },
    ])
  })

  it('zwycięzca nie trafia na listę settlements (filtr p.user_id !== winnerId)', async () => {
    const betResultsTable = mockTable([{ id: 1, bet_id: 'bet-1', winner_id: 'user-1', confirmed: true }])
    const insertChain = chainResponse({ data: [{ id: 's-1' }, { id: 's-2' }], error: null })
    mockFrom.mockReturnValueOnce(betResultsTable).mockReturnValueOnce(insertChain)

    const result = await createSettlementsFromWinner('bet-1', [
      { user_id: 'user-1', stake_amount: 30 },
      { user_id: 'user-2', stake_amount: 30 },
      { user_id: 'user-3', stake_amount: 30 },
    ])

    expect(result).toEqual({})
    const insertedRows = insertChain.insert.mock.calls[0][0] as { debtor_id: string }[]
    expect(insertedRows).toHaveLength(2)
    expect(insertedRows.some(row => row.debtor_id === 'user-1')).toBe(false)
  })

  it('stake_amount = 0 u przegranego → settlementRows puste → {} i brak insertu', async () => {
    const betResultsTable = mockTable([{ id: 1, bet_id: 'bet-1', winner_id: 'user-1', confirmed: true }])
    mockFrom.mockReturnValueOnce(betResultsTable)

    const result = await createSettlementsFromWinner('bet-1', [
      { user_id: 'user-1', stake_amount: 50 },
      { user_id: 'user-2', stake_amount: 0 },
    ])

    expect(result).toEqual({})
    expect(mockFrom).not.toHaveBeenCalledWith('settlements')
  })

  it('stake_amount ujemny → {} i brak insertu (ochrona przed śmieciowymi danymi)', async () => {
    const betResultsTable = mockTable([{ id: 1, bet_id: 'bet-1', winner_id: 'user-1', confirmed: true }])
    mockFrom.mockReturnValueOnce(betResultsTable)

    const result = await createSettlementsFromWinner('bet-1', [
      { user_id: 'user-1', stake_amount: 50 },
      { user_id: 'user-2', stake_amount: -10 },
    ])

    expect(result).toEqual({})
    expect(mockFrom).not.toHaveBeenCalledWith('settlements')
  })

  describe('zaokrąglanie kwoty (Math.round)', () => {
    it('stake_amount = 50.4 → amount === 50', async () => {
      const betResultsTable = mockTable([{ id: 1, bet_id: 'bet-1', winner_id: 'user-1', confirmed: true }])
      const insertChain = chainResponse({ data: [{ id: 's-1' }], error: null })
      mockFrom.mockReturnValueOnce(betResultsTable).mockReturnValueOnce(insertChain)

      const result = await createSettlementsFromWinner('bet-1', [
        { user_id: 'user-1', stake_amount: 50 },
        { user_id: 'user-2', stake_amount: 50.4 },
      ])

      expect(result).toEqual({})
      expect(insertChain.insert).toHaveBeenCalledWith([
        { bet_id: 'bet-1', debtor_id: 'user-2', creditor_id: 'user-1', amount: 50 },
      ])
    })

    it('stake_amount = 50.5 → amount === 51', async () => {
      const betResultsTable = mockTable([{ id: 1, bet_id: 'bet-1', winner_id: 'user-1', confirmed: true }])
      const insertChain = chainResponse({ data: [{ id: 's-1' }], error: null })
      mockFrom.mockReturnValueOnce(betResultsTable).mockReturnValueOnce(insertChain)

      const result = await createSettlementsFromWinner('bet-1', [
        { user_id: 'user-1', stake_amount: 50 },
        { user_id: 'user-2', stake_amount: 50.5 },
      ])

      expect(result).toEqual({})
      expect(insertChain.insert).toHaveBeenCalledWith([
        { bet_id: 'bet-1', debtor_id: 'user-2', creditor_id: 'user-1', amount: 51 },
      ])
    })
  })

  it('błąd przy insert → propaguje błąd', async () => {
    const betResultsTable = mockTable([{ id: 1, bet_id: 'bet-1', winner_id: 'user-1', confirmed: true }])
    const insertChain = chainResponse({ data: null, error: { message: 'insert failed' } })
    mockFrom.mockReturnValueOnce(betResultsTable).mockReturnValueOnce(insertChain)

    const result = await createSettlementsFromWinner('bet-1', [
      { user_id: 'user-1', stake_amount: 50 },
      { user_id: 'user-2', stake_amount: 50 },
    ])

    expect(result).toEqual({ error: 'insert failed' })
  })
})
