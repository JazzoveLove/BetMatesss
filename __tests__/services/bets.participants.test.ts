import { chainResponse } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import { confirmParticipation, rejectParticipation } from '@/features/bets/api/bets.participants'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

const mockFrom = supabase.from as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('confirmParticipation', () => {
  it('update confirmed:true się nie powiedzie → propaguje błąd, drugie zapytanie (o wszystkich uczestników) NIE leci', async () => {
    const confirmChain = chainResponse({ data: null, error: { message: 'confirm failed' } })
    // pułapka: gdyby błąd nie zatrzymał pipeline'u, poleciałoby zapytanie o
    // wszystkich uczestników — .select() poniżej musi zostać niewywołane
    const allTrap = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(confirmChain).mockReturnValueOnce(allTrap)

    const result = await confirmParticipation('bet-1', 'user-1')

    expect(result).toEqual({ error: 'confirm failed' })
    expect(allTrap.select).not.toHaveBeenCalled()
  })

  it('wszyscy uczestnicy potwierdzili → dodatkowy update bets.status na "active" z guardem .eq("status", "pending")', async () => {
    const confirmChain = chainResponse({ data: null, error: null })
    const allChain = chainResponse({ data: [{ confirmed: true }, { confirmed: true }], error: null })
    const statusChain = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(confirmChain).mockReturnValueOnce(allChain).mockReturnValueOnce(statusChain)

    const result = await confirmParticipation('bet-1', 'user-1')

    expect(result).toEqual({})
    expect(statusChain.update).toHaveBeenCalledWith({ status: 'active' })
    expect(statusChain.eq).toHaveBeenNthCalledWith(1, 'id', 'bet-1')
    expect(statusChain.eq).toHaveBeenNthCalledWith(2, 'status', 'pending')
  })

  it('NIE wszyscy uczestnicy potwierdzili → status zakładu NIE jest aktualizowany', async () => {
    const confirmChain = chainResponse({ data: null, error: null })
    const allChain = chainResponse({ data: [{ confirmed: true }, { confirmed: false }], error: null })
    const statusTrap = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(confirmChain).mockReturnValueOnce(allChain).mockReturnValueOnce(statusTrap)

    const result = await confirmParticipation('bet-1', 'user-1')

    expect(result).toEqual({})
    expect(statusTrap.update).not.toHaveBeenCalled()
  })

  it('błąd przy update statusu zakładu → propaguje', async () => {
    const confirmChain = chainResponse({ data: null, error: null })
    const allChain = chainResponse({ data: [{ confirmed: true }], error: null })
    const statusChain = chainResponse({ data: null, error: { message: 'status update failed' } })
    mockFrom.mockReturnValueOnce(confirmChain).mockReturnValueOnce(allChain).mockReturnValueOnce(statusChain)

    const result = await confirmParticipation('bet-1', 'user-1')

    expect(result).toEqual({ error: 'status update failed' })
  })
})

describe('rejectParticipation', () => {
  // Test wprost odpowiadający na znalezisko z Sentry: bez tego guardu
  // ktoś niebędący uczestnikiem zakładu mógłby po cichu zmienić jego status
  // na 'rejected'. Guard musi dawać czytelny błąd, a update w ogóle nie leci.
  it('[sentry-investigation] user niebędący uczestnikiem dostaje czytelny błąd zamiast cichego update', async () => {
    const checkChain = chainResponse({ data: null, error: null })
    const updateTrap = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(checkChain).mockReturnValueOnce(updateTrap)

    const result = await rejectParticipation('bet-1', 'user-99')

    expect(result).toEqual({ error: 'Nie jesteś uczestnikiem tego zakładu.' })
    expect(updateTrap.update).not.toHaveBeenCalled()
  })

  it('błąd przy sprawdzaniu uczestnictwa → propaguje', async () => {
    const checkChain = chainResponse({ data: null, error: { message: 'check failed' } })
    mockFrom.mockReturnValueOnce(checkChain)

    const result = await rejectParticipation('bet-1', 'user-1')

    expect(result).toEqual({ error: 'check failed' })
  })

  it('sukces → status:"rejected" i rejected_at jako poprawny znacznik czasu (czas zamrożony)', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-21T12:00:00.000Z'))
    const checkChain = chainResponse({ data: { user_id: 'user-1' }, error: null })
    const updateChain = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(checkChain).mockReturnValueOnce(updateChain)

    const result = await rejectParticipation('bet-1', 'user-1')

    expect(result).toEqual({})
    expect(updateChain.update).toHaveBeenCalledWith({
      status: 'rejected',
      rejected_at: '2026-08-21T12:00:00.000Z',
    })
    expect(updateChain.eq).toHaveBeenNthCalledWith(1, 'id', 'bet-1')
    expect(updateChain.eq).toHaveBeenNthCalledWith(2, 'status', 'pending')
  })

  it('błąd przy update → propaguje', async () => {
    const checkChain = chainResponse({ data: { user_id: 'user-1' }, error: null })
    const updateChain = chainResponse({ data: null, error: { message: 'update failed' } })
    mockFrom.mockReturnValueOnce(checkChain).mockReturnValueOnce(updateChain)

    const result = await rejectParticipation('bet-1', 'user-1')

    expect(result).toEqual({ error: 'update failed' })
  })
})
