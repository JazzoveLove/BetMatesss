import { supabase } from '@/shared/lib/supabase'
import { getBalancesScreenData } from '@/features/balances/api/balances.queries'
import { DELETED_USER_NICK } from '@/shared/constants/user/deletedUser'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

const mockRpc = supabase.rpc as jest.Mock

beforeEach(() => {
  mockRpc.mockReset()
})

// Wiersz w kształcie, w jakim zwraca go RPC get_balances_screen_data.
function rpcRow(over: Partial<Record<string, unknown>> = {}) {
  return {
    other_id: 'other-1',
    nick: 'Ola',
    avatar_url: null,
    is_friend: true,
    deleted_at: null,
    balance: 0,
    match_count: 0,
    ...over,
  }
}

describe('getBalancesScreenData — jedno RPC, mapowanie na BalanceRow', () => {
  it('mapuje snake_case → BalanceRow, zachowuje is_friend', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        rpcRow({ other_id: 'f1', nick: 'Ola', avatar_url: 'http://a/ola.png', is_friend: true, balance: 50, match_count: 3 }),
        rpcRow({ other_id: 'f2', nick: 'Kuba', avatar_url: null, is_friend: true, balance: 0, match_count: 0 }),
      ],
      error: null,
    })

    const result = await getBalancesScreenData('user-1')

    expect(result).toEqual([
      { id: 'f1', nick: 'Ola', avatarUrl: 'http://a/ola.png', balance: 50, matchCount: 3, isFriend: true },
      { id: 'f2', nick: 'Kuba', avatarUrl: null, balance: 0, matchCount: 0, isFriend: true },
    ])
    expect(mockRpc).toHaveBeenCalledTimes(1)
    expect(mockRpc).toHaveBeenCalledWith('get_balances_screen_data', { p_viewer: 'user-1' })
  })

  it('osoba z is_friend=false i saldem POJAWIA się w wyniku (pin regresu BŁĘDU-1)', async () => {
    // makaka1 usunął konto / został usunięty ze znajomych — nie ma go już w
    // friendships, ale RPC i tak go zwraca, bo istnieje w CTE salda.
    mockRpc.mockResolvedValueOnce({
      data: [
        rpcRow({
          other_id: 'ghost-1',
          nick: 'usuniety_x',
          is_friend: false,
          deleted_at: '2026-01-01T00:00:00Z',
          balance: 10,
          match_count: 2,
        }),
      ],
      error: null,
    })

    const result = await getBalancesScreenData('user-1')

    expect(result).toEqual([
      { id: 'ghost-1', nick: DELETED_USER_NICK, avatarUrl: null, balance: 10, matchCount: 2, isFriend: false },
    ])
  })

  it('deleted_at ustawione → nick to "Usunięty użytkownik", surowy nick z RPC ignorowany', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [rpcRow({ nick: 'PrawdziwyNick', deleted_at: '2026-05-01T12:00:00Z' })],
      error: null,
    })

    const result = await getBalancesScreenData('user-1')

    expect(result[0].nick).toBe(DELETED_USER_NICK)
  })

  it('deleted_at null → nick prosto z bazy (były znajomy zachowuje swój nick)', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [rpcRow({ other_id: 'ex-1', nick: 'Bartek', is_friend: false, deleted_at: null, balance: 30 })],
      error: null,
    })

    const result = await getBalancesScreenData('user-1')

    expect(result[0]).toMatchObject({ id: 'ex-1', nick: 'Bartek', balance: 30, isFriend: false })
  })

  it('nick NULL z RPC (nieodczytany profil) → etykieta zastępcza, ale wiersz z saldem zostaje (fail-open)', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [rpcRow({ other_id: 'x1', nick: null, is_friend: false, balance: 12 })],
      error: null,
    })

    const result = await getBalancesScreenData('user-1')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'x1', balance: 12, isFriend: false })
    expect(result[0].nick).toBe('Znajomy')
  })

  it('balance / match_count przychodzące jako string → number', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [rpcRow({ balance: '-15', match_count: '4' })],
      error: null,
    })

    const result = await getBalancesScreenData('user-1')

    expect(result[0].balance).toBe(-15)
    expect(result[0].matchCount).toBe(4)
    expect(typeof result[0].balance).toBe('number')
  })

  it('błąd RPC → throw (fail-closed, NIE pusta lista)', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'boom' } })

    await expect(getBalancesScreenData('user-1')).rejects.toEqual({ message: 'boom' })
  })

  it('pusty wynik RPC → pusta lista, bez wyjątku', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null })

    await expect(getBalancesScreenData('user-1')).resolves.toEqual([])
  })

  it('data === null przy braku błędu → pusta lista', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null })

    await expect(getBalancesScreenData('user-1')).resolves.toEqual([])
  })
})
