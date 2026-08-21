import { chainResponse, mockTable } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import { createSettlements } from '@/features/settlements/api/settlements.create'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

const mockFrom = supabase.from as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
})

describe('createSettlements', () => {
  it('dla stake_mode "none" NIE tworzy żadnego rozliczenia', async () => {
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

    const result = await createSettlements('bet-1')

    expect(result).toEqual({})
    expect(mockFrom).toHaveBeenCalledTimes(3)
  })

  it('dla stake_mode "equal" tworzy jedno rozliczenie: przegrany debtor, zwycięzca creditor, kwota = stawka', async () => {
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

    const result = await createSettlements('bet-1')

    expect(result).toEqual({})
    expect(insertChain.insert).toHaveBeenCalledWith([
      { bet_id: 'bet-1', debtor_id: 'user-2', creditor_id: 'user-1', amount: 50 },
    ])
  })

  it('zwraca błąd gdy nie da się pobrać danych zakładu', async () => {
    const countChain = chainResponse({ data: null, count: 0, error: null } as any)
    const betChain = chainResponse({ data: null, error: { message: 'DB error' } })
    mockFrom.mockReturnValueOnce(countChain).mockReturnValueOnce(betChain)

    const result = await createSettlements('bet-1')

    expect(result).toEqual({ error: 'DB error' })
  })

  it('obejście: stake_mode "none", ale uczestnik ma stake_amount > 0 — traktowane jako "equal" (celowe zabezpieczenie)', async () => {
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

    const result = await createSettlements('bet-1')

    expect(result).toEqual({})
    expect(insertChain.insert).toHaveBeenCalledWith([
      { bet_id: 'bet-1', debtor_id: 'user-2', creditor_id: 'user-1', amount: 50 },
    ])
  })

  it('idempotencja: gdy rozliczenia już istnieją (count > 0) → natychmiastowe {}, bez dalszych zapytań i insertu', async () => {
    const countChain = chainResponse({ data: null, count: 3, error: null } as any)
    mockFrom.mockReturnValueOnce(countChain)

    const result = await createSettlements('bet-1')

    expect(result).toEqual({})
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('błąd przy zliczaniu istniejących rozliczeń → propaguje błąd, nic dalej nie leci', async () => {
    const countChain = chainResponse({ data: null, count: null, error: { message: 'count failed' } } as any)
    // pułapka: gdyby kod mimo błędu poleciał dalej, zapytanie o zakład by
    // wystartowało — .select() poniżej musi zostać niewywołane
    const betTrap = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(countChain).mockReturnValueOnce(betTrap)

    const result = await createSettlements('bet-1')

    expect(result).toEqual({ error: 'count failed' })
    expect(betTrap.select).not.toHaveBeenCalled()
  })

  it('bet === null (brak zakładu, bez błędu bazy) → "Nie znaleziono zakładu."', async () => {
    const countChain = chainResponse({ data: null, count: 0, error: null } as any)
    // realne filtrowanie: w tabeli istnieje inny zakład, ale nie ten o id
    // 'bet-1' — .eq('id', betId) musi go faktycznie odrzucić, zamiast testu
    // przechodzącego tylko dlatego, że ktoś z góry zaszył data: null
    const betsTable = mockTable([{ id: 'other-bet', stake_mode: 'equal', format: 'single', stake_per_match: 0 }])
    const participantsTrap = chainResponse({ data: [], error: null })
    mockFrom.mockReturnValueOnce(countChain).mockReturnValueOnce(betsTable).mockReturnValueOnce(participantsTrap)

    const result = await createSettlements('bet-1')

    expect(result).toEqual({ error: 'Nie znaleziono zakładu.' })
    expect(participantsTrap.select).not.toHaveBeenCalled()
  })

  it('błąd przy pobieraniu uczestników → propaguje błąd, nic dalej nie leci', async () => {
    const countChain = chainResponse({ data: null, count: 0, error: null } as any)
    const betChain = chainResponse({
      data: { id: 'bet-1', stake_mode: 'equal', format: 'single', stake_per_match: 0 },
      error: null,
    })
    const participantsChain = chainResponse({ data: null, error: { message: 'participants failed' } })
    // pułapka: gdyby błąd nie zatrzymał pipeline'u, poleciałoby zapytanie o
    // wynik zwycięzcy (bet_results) — .select() poniżej musi zostać niewywołane
    const betResultsTrap = chainResponse({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(betChain)
      .mockReturnValueOnce(participantsChain)
      .mockReturnValueOnce(betResultsTrap)

    const result = await createSettlements('bet-1')

    expect(result).toEqual({ error: 'participants failed' })
    expect(betResultsTrap.select).not.toHaveBeenCalled()
  })

  it('brak uczestników (partRows.length === 0) → {} bez insertu', async () => {
    const countChain = chainResponse({ data: null, count: 0, error: null } as any)
    const betChain = chainResponse({
      data: { id: 'bet-1', stake_mode: 'equal', format: 'single', stake_per_match: 0 },
      error: null,
    })
    // realne filtrowanie: uczestnik istnieje w tabeli, ale dla innego zakładu —
    // .eq('bet_id', betId) musi go faktycznie wykluczyć
    const participantsTable = mockTable([{ user_id: 'user-1', stake_amount: 50, bet_id: 'other-bet' }])
    const betResultsTrap = chainResponse({ data: null, error: null })
    mockFrom
      .mockReturnValueOnce(countChain)
      .mockReturnValueOnce(betChain)
      .mockReturnValueOnce(participantsTable)
      .mockReturnValueOnce(betResultsTrap)

    const result = await createSettlements('bet-1')

    expect(result).toEqual({})
    expect(betResultsTrap.select).not.toHaveBeenCalled()
  })
})
