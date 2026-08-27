import { supabase } from '@/shared/lib/supabase'
import { getAcceptedFriendsList } from '@/features/friends'
import { getBalancesScreenData } from '@/features/balances/api/balances.queries'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})
jest.mock('@/features/friends', () => ({ getAcceptedFriendsList: jest.fn() }))

const mockRpc = supabase.rpc as jest.Mock
const mockGetAcceptedFriendsList = getAcceptedFriendsList as jest.Mock

beforeEach(() => {
  mockRpc.mockReset()
  mockGetAcceptedFriendsList.mockReset()
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
      { id: 'friend-1', nick: 'Ola', avatarUrl: 'https://x/ola.png', balance: 50, matchCount: 3 },
      { id: 'friend-2', nick: 'Kuba', avatarUrl: null, balance: 0, matchCount: 0 },
    ])
  })

  it('znajomy bez wpisu w RPC dostaje domyślnie balance 0 i matchCount 0', async () => {
    mockGetAcceptedFriendsList.mockResolvedValue([{ id: 'friend-1', nick: 'Ola', avatar_url: null }])
    mockRpc
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const result = await getBalancesScreenData('user-1')

    expect(result).toEqual([{ id: 'friend-1', nick: 'Ola', avatarUrl: null, balance: 0, matchCount: 0 }])
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

  it('błąd RPC liczby meczów jest rzucany dalej', async () => {
    mockGetAcceptedFriendsList.mockResolvedValue([{ id: 'friend-1', nick: 'Ola', avatar_url: null }])
    mockRpc
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'boom' } })

    await expect(getBalancesScreenData('user-1')).rejects.toEqual({ message: 'boom' })
  })
})
