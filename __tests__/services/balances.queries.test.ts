import { supabase } from '@/shared/lib/supabase'
import { getAcceptedFriendsList, loadNicksByIds } from '@/features/friends'
import { getBalancesScreenData } from '@/features/balances/api/balances.queries'
import { DELETED_USER_NICK } from '@/shared/constants/user/deletedUser'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})
jest.mock('@/features/friends', () => ({
  getAcceptedFriendsList: jest.fn(),
  loadNicksByIds: jest.fn(),
}))

const mockRpc = supabase.rpc as jest.Mock
const mockGetAcceptedFriendsList = getAcceptedFriendsList as jest.Mock
const mockLoadNicksByIds = loadNicksByIds as jest.Mock

beforeEach(() => {
  mockRpc.mockReset()
  mockGetAcceptedFriendsList.mockReset()
  mockLoadNicksByIds.mockReset()
  // loadNicksByIds nigdy nie rzuca — przy błędzie/braku wiersza zwraca {}.
  mockLoadNicksByIds.mockResolvedValue({})
})

describe('getBalancesScreenData', () => {
  it('łączy listę znajomych z saldami i liczbą meczów po id', async () => {
    mockGetAcceptedFriendsList.mockResolvedValue([
      { id: 'friend-1', nick: 'Ola', avatar_url: 'https://x/ola.png' },
      { id: 'friend-2', nick: 'Kuba', avatar_url: null },
    ])
    mockRpc
      .mockResolvedValueOnce({ data: [{ other_id: 'friend-1', balance: 50 }], error: null })
      .mockResolvedValueOnce({ data: [{ other_id: 'friend-1', match_count: 3 }], error: null })

    const result = await getBalancesScreenData('user-1')

    expect(result).toEqual([
      { id: 'friend-1', nick: 'Ola', avatarUrl: 'https://x/ola.png', balance: 50, matchCount: 3, isFriend: true },
      { id: 'friend-2', nick: 'Kuba', avatarUrl: null, balance: 0, matchCount: 0, isFriend: true },
    ])
  })

  it('znajomy z listy bez wpisu w RPC → nadal widoczny z saldem 0 (nie zgub tego zachowania)', async () => {
    mockGetAcceptedFriendsList.mockResolvedValue([{ id: 'friend-1', nick: 'Ola', avatar_url: null }])
    mockRpc
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const result = await getBalancesScreenData('user-1')

    expect(result).toEqual([
      { id: 'friend-1', nick: 'Ola', avatarUrl: null, balance: 0, matchCount: 0, isFriend: true },
    ])
  })

  it('brak znajomych → pusta lista, RPC i tak są wołane', async () => {
    mockGetAcceptedFriendsList.mockResolvedValue([])
    mockRpc
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const result = await getBalancesScreenData('user-1')

    expect(result).toEqual([])
  })

  it('błąd RPC sald jest rzucany dalej', async () => {
    mockGetAcceptedFriendsList.mockResolvedValue([{ id: 'friend-1', nick: 'Ola', avatar_url: null }])
    mockRpc
      .mockResolvedValueOnce({ data: null, error: { message: 'boom' } })
      .mockResolvedValueOnce({ data: [], error: null })

    await expect(getBalancesScreenData('user-1')).rejects.toEqual({ message: 'boom' })
  })

  it('błąd RPC liczby meczów jest rzucany dalej (fail-closed na saldach)', async () => {
    mockGetAcceptedFriendsList.mockResolvedValue([{ id: 'friend-1', nick: 'Ola', avatar_url: null }])
    mockRpc
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'boom' } })

    await expect(getBalancesScreenData('user-1')).rejects.toEqual({ message: 'boom' })
  })
})

describe('getBalancesScreenData — salda z osobami spoza listy znajomych (BŁĄD-1)', () => {
  it('saldo z osobą, której NIE MA na liście znajomych, pojawia się w wyniku (pin regresu)', async () => {
    // makaka1 usunął konto → nie ma go w getAcceptedFriendsList, ale
    // get_balances_with_friends nadal zwraca saldo. Wcześniej ten wiersz był
    // po cichu wyrzucany.
    mockGetAcceptedFriendsList.mockResolvedValue([])
    mockRpc
      .mockResolvedValueOnce({ data: [{ other_id: 'ghost-1', balance: 10 }], error: null })
      .mockResolvedValueOnce({ data: [{ other_id: 'ghost-1', match_count: 2 }], error: null })
    mockLoadNicksByIds.mockResolvedValue({ 'ghost-1': DELETED_USER_NICK })

    const result = await getBalancesScreenData('user-1')

    expect(result).toEqual([
      { id: 'ghost-1', nick: DELETED_USER_NICK, avatarUrl: null, balance: 10, matchCount: 2, isFriend: false },
    ])
    expect(mockLoadNicksByIds).toHaveBeenCalledWith(['ghost-1'])
  })

  it('osoba z deleted_at → nazwa "Usunięty użytkownik"', async () => {
    mockGetAcceptedFriendsList.mockResolvedValue([])
    mockRpc
      .mockResolvedValueOnce({ data: [{ other_id: 'ghost-1', balance: -5 }], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
    // loadNicksByIds odwzorowuje deleted_at → DELETED_USER_NICK wewnętrznie.
    mockLoadNicksByIds.mockResolvedValue({ 'ghost-1': DELETED_USER_NICK })

    const result = await getBalancesScreenData('user-1')

    expect(result[0].nick).toBe(DELETED_USER_NICK)
    expect(result[0].isFriend).toBe(false)
  })

  it('były znajomy bez deleted_at → własny nick', async () => {
    mockGetAcceptedFriendsList.mockResolvedValue([])
    mockRpc
      .mockResolvedValueOnce({ data: [{ other_id: 'ex-1', balance: 30 }], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
    mockLoadNicksByIds.mockResolvedValue({ 'ex-1': 'Bartek' })

    const result = await getBalancesScreenData('user-1')

    expect(result[0]).toMatchObject({ id: 'ex-1', nick: 'Bartek', balance: 30, isFriend: false })
  })

  it('nie da się odczytać profilu (loadNicksByIds zwraca {}) → wiersz z saldem NADAL jest (fail-open na profilu)', async () => {
    mockGetAcceptedFriendsList.mockResolvedValue([])
    mockRpc
      .mockResolvedValueOnce({ data: [{ other_id: 'ghost-1', balance: 12 }], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
    mockLoadNicksByIds.mockResolvedValue({})

    const result = await getBalancesScreenData('user-1')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'ghost-1', balance: 12, isFriend: false })
    expect(result[0].nick).toBe('Znajomy')
  })

  it('ktoś jednocześnie znajomy i mający saldo → jeden wiersz, isFriend true, bez duplikatu', async () => {
    mockGetAcceptedFriendsList.mockResolvedValue([{ id: 'friend-1', nick: 'Ola', avatar_url: null }])
    mockRpc
      .mockResolvedValueOnce({ data: [{ other_id: 'friend-1', balance: 40 }], error: null })
      .mockResolvedValueOnce({ data: [{ other_id: 'friend-1', match_count: 1 }], error: null })

    const result = await getBalancesScreenData('user-1')

    expect(result).toEqual([
      { id: 'friend-1', nick: 'Ola', avatarUrl: null, balance: 40, matchCount: 1, isFriend: true },
    ])
    // znajomy rozwiązany z listy znajomych — loadNicksByIds nie jest wołane
    expect(mockLoadNicksByIds).not.toHaveBeenCalled()
  })

  it('getAcceptedFriendsList połknął błąd i zwrócił [] → salda NIE giną, ale znajomi lądują w Nieaktywnych', async () => {
    // Świadomy pin: getAcceptedFriendsList robi `if (error) return []` (poza
    // zakresem tej zmiany — inne miejsca zależą od tej sygnatury). Skutkiem
    // przejściowego błędu zapytania o znajomości jest reklasyfikacja na
    // Nieaktywnych, ale — co najważniejsze — żaden dług nie znika.
    mockGetAcceptedFriendsList.mockResolvedValue([])
    mockRpc
      .mockResolvedValueOnce({ data: [{ other_id: 'friend-1', balance: 15 }], error: null })
      .mockResolvedValueOnce({ data: [{ other_id: 'friend-1', match_count: 4 }], error: null })
    mockLoadNicksByIds.mockResolvedValue({ 'friend-1': 'Ola' })

    const result = await getBalancesScreenData('user-1')

    expect(result).toEqual([
      { id: 'friend-1', nick: 'Ola', avatarUrl: null, balance: 15, matchCount: 4, isFriend: false },
    ])
  })

  it('znajomi w wyniku przed sekcją Nieaktywni; nieznajomi posortowani deterministycznie po id', async () => {
    mockGetAcceptedFriendsList.mockResolvedValue([{ id: 'friend-1', nick: 'Ola', avatar_url: null }])
    mockRpc
      .mockResolvedValueOnce({
        data: [
          { other_id: 'zeta', balance: -1 },
          { other_id: 'alpha', balance: 7 },
          { other_id: 'friend-1', balance: 3 },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: [], error: null })
    mockLoadNicksByIds.mockResolvedValue({ alpha: 'Ala', zeta: 'Zenon' })

    const result = await getBalancesScreenData('user-1')

    expect(result.map(r => r.id)).toEqual(['friend-1', 'alpha', 'zeta'])
    expect(mockLoadNicksByIds).toHaveBeenCalledWith(['alpha', 'zeta'])
  })
})
