import { chainResponse } from '../helpers/supabaseMock'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

import { supabase } from '@/shared/lib/supabase'
import { createSettlements } from '@/features/settlements/api/settlements.create'

const mockFrom = supabase.from as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
})

describe('createSettlements', () => {
  it('dla stake_mode "none" NIE tworzy żadnego rozliczenia', async () => {
    // Arrange
    const countChain = chainResponse({ data: null, count: 0, error: null } as any)
    const betChain = chainResponse({
      data: { id: 'bet-1', stake_mode: 'none', format: 'single', stake_per_match: 0 },
      error: null,
    })
    const noStakeCheckChain = chainResponse({ data: [], error: null })
    mockFrom
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(betChain)
      .mockReturnValueOnce(noStakeCheckChain)

    // Act
    const result = await createSettlements('bet-1')

    // Assert: żadnego insertu — tylko 3 zapytania odczytowe (count, bets, sprawdzenie kwot)
    expect(result).toEqual({})
    expect(mockFrom).toHaveBeenCalledTimes(3)
  })

  it('dla stake_mode "equal" tworzy jedno rozliczenie: przegrany debtor, zwycięzca creditor, kwota = stawka', async () => {
    // Arrange
    const countChain = chainResponse({ data: null, count: 0, error: null } as any)
    const betChain = chainResponse({
      data: { id: 'bet-1', stake_mode: 'equal', format: 'single', stake_per_match: 0 },
      error: null,
    })
    const participantsChain = chainResponse({
      data: [
        { user_id: 'user-1', stake_amount: 50 },
        { user_id: 'user-2', stake_amount: 50 },
      ],
      error: null,
    })
    const winnerChain = chainResponse({ data: { winner_id: 'user-1' }, error: null })
    const insertChain = chainResponse({ data: [{ id: 'settlement-1' }], error: null })
    mockFrom
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(betChain)
      .mockReturnValueOnce(participantsChain)
      .mockReturnValueOnce(winnerChain)
      .mockReturnValueOnce(insertChain)

    // Act
    const result = await createSettlements('bet-1')

    // Assert
    expect(result).toEqual({})
    expect(insertChain.insert).toHaveBeenCalledWith([
      { bet_id: 'bet-1', debtor_id: 'user-2', creditor_id: 'user-1', amount: 50, paid: false },
    ])
  })

  it('zwraca błąd gdy nie da się pobrać danych zakładu', async () => {
    // Arrange
    const countChain = chainResponse({ data: null, count: 0, error: null } as any)
    const betChain = chainResponse({ data: null, error: { message: 'DB error' } })
    mockFrom.mockReturnValueOnce(countChain).mockReturnValueOnce(betChain)

    // Act
    const result = await createSettlements('bet-1')

    // Assert
    expect(result).toEqual({ error: 'DB error' })
  })

  it('obejście: stake_mode "none", ale uczestnik ma stake_amount > 0 — traktowane jako "equal" (celowe zabezpieczenie)', async () => {
    // Arrange
    const countChain = chainResponse({ data: null, count: 0, error: null } as any)
    const betChain = chainResponse({
      data: { id: 'bet-1', stake_mode: 'none', format: 'single', stake_per_match: 0 },
      error: null,
    })
    const stakeCheckChain = chainResponse({ data: [{ stake_amount: 50 }], error: null })
    const participantsChain = chainResponse({
      data: [
        { user_id: 'user-1', stake_amount: 50 },
        { user_id: 'user-2', stake_amount: 50 },
      ],
      error: null,
    })
    const winnerChain = chainResponse({ data: { winner_id: 'user-1' }, error: null })
    const insertChain = chainResponse({ data: [{ id: 'settlement-1' }], error: null })
    mockFrom
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(betChain)
      .mockReturnValueOnce(stakeCheckChain)
      .mockReturnValueOnce(participantsChain)
      .mockReturnValueOnce(winnerChain)
      .mockReturnValueOnce(insertChain)

    // Act
    const result = await createSettlements('bet-1')

    // Assert: mimo stake_mode 'none', rozliczenie i tak powstaje, bo uczestnicy mieli kwoty > 0
    expect(result).toEqual({})
    expect(insertChain.insert).toHaveBeenCalledWith([
      { bet_id: 'bet-1', debtor_id: 'user-2', creditor_id: 'user-1', amount: 50, paid: false },
    ])
  })
})
