import { chainResponse } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import { getPairDetail } from '@/features/friend-detail/api/friendDetail.queries'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

const mockFrom = supabase.from as jest.Mock
const mockRpc = supabase.rpc as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
  mockRpc.mockReset()
})

describe('getPairDetail', () => {
  it('znajomy z ustawionym deleted_at → friendNick to DELETED_USER_NICK, nie prawdziwy nick', async () => {
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: { nick: 'PrawdziwyNick', deleted_at: '2026-01-01T00:00:00Z' }, error: null }),
    )
    mockRpc.mockResolvedValueOnce({ data: 0, error: null }).mockResolvedValueOnce({ data: [], error: null })

    const result = await getPairDetail('user-1', 'user-2')

    expect(result.friendNick).toBe('Usunięty użytkownik')
  })

  it('friendRow === null → fallback "Znajomy"', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))
    mockRpc.mockResolvedValueOnce({ data: 0, error: null }).mockResolvedValueOnce({ data: [], error: null })

    const result = await getPairDetail('user-1', 'user-2')

    expect(result.friendNick).toBe('Znajomy')
  })

  it('balanceRes.data === null → balance === 0 (nie null, nie NaN)', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: { nick: 'Kuba', deleted_at: null }, error: null }))
    mockRpc.mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: [], error: null })

    const result = await getPairDetail('user-1', 'user-2')

    expect(result.balance).toBe(0)
    expect(Number.isNaN(result.balance)).toBe(false)
  })

  it('statsRes.data === null → stats to pusta tablica, nie undefined/crash', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: { nick: 'Kuba', deleted_at: null }, error: null }))
    mockRpc.mockResolvedValueOnce({ data: 25, error: null }).mockResolvedValueOnce({ data: null, error: null })

    const result = await getPairDetail('user-1', 'user-2')

    expect(result.stats).toEqual([])
  })

  it('mapowanie wiersza: game_template/wins/losses → gameTemplate/wins/losses', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: { nick: 'Kuba', deleted_at: null }, error: null }))
    mockRpc
      .mockResolvedValueOnce({ data: 10, error: null })
      .mockResolvedValueOnce({ data: [{ game_template: 'FIFA', wins: 3, losses: 1 }], error: null })

    const result = await getPairDetail('user-1', 'user-2')

    expect(result.stats).toEqual([{ gameTemplate: 'FIFA', wins: 3, losses: 1 }])
  })

  it('błąd w zapytaniu friendRes → funkcja rzuca, nie zwraca cichych częściowych danych', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: { message: 'friend query failed' } }))
    mockRpc.mockResolvedValueOnce({ data: 10, error: null }).mockResolvedValueOnce({ data: [], error: null })

    await expect(getPairDetail('user-1', 'user-2')).rejects.toEqual({ message: 'friend query failed' })
  })

  it('błąd w zapytaniu balanceRes → funkcja rzuca, nie zwraca cichych częściowych danych', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: { nick: 'Kuba', deleted_at: null }, error: null }))
    mockRpc
      .mockResolvedValueOnce({ data: null, error: { message: 'balance rpc failed' } })
      .mockResolvedValueOnce({ data: [], error: null })

    await expect(getPairDetail('user-1', 'user-2')).rejects.toEqual({ message: 'balance rpc failed' })
  })

  it('błąd w zapytaniu statsRes → funkcja rzuca, nie zwraca cichych częściowych danych', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: { nick: 'Kuba', deleted_at: null }, error: null }))
    mockRpc
      .mockResolvedValueOnce({ data: 10, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'stats rpc failed' } })

    await expect(getPairDetail('user-1', 'user-2')).rejects.toEqual({ message: 'stats rpc failed' })
  })
})
