import { historyBadgeAndAmount } from '@/features/bets/api/bets.history'
import { getFriendsBalanceLeaderboard } from '@/features/bets/api/bets.queries'
import { getBalancesScreenData } from '@/features/balances/api/balances.queries'
import type { BetRow } from '@/features/bets/types/bet.types'
import type { BalanceRow } from '@/features/balances/types/balance.types'

jest.mock('@/shared/lib/supabase', () => ({ supabase: {} }))
jest.mock('@/features/friends', () => ({}))
jest.mock('@/features/balances/api/balances.queries', () => ({ getBalancesScreenData: jest.fn() }))

const mockGetBalancesScreenData = getBalancesScreenData as jest.Mock

function balRow(over: Partial<BalanceRow> = {}): BalanceRow {
  return { id: 'x', nick: 'X', avatarUrl: null, balance: 0, matchCount: 0, isFriend: true, ...over }
}

const baseBet: BetRow = {
  id: '1',
  creator_id: 'user-1',
  game_template: 'football',
  format: 'single',
  stake_mode: 'equal',
  status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
  rejected_at: null,
  stake_per_match: null,
}

describe('historyBadgeAndAmount', () => {
  describe('zakłady w toku', () => {
    it('pending → oczekuje, brak kwoty', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'pending' }, 0, false, null)).toEqual({
        badge: 'oczekuje',
        amountLabel: '—',
      })
    })

    it('active → aktywny, brak kwoty', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'active' }, 0, false, null)).toEqual({
        badge: 'aktywny',
        amountLabel: '—',
      })
    })

    it('awaiting_confirmation → aktywny, brak kwoty', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'awaiting_confirmation' }, 100, false, null)).toEqual({
        badge: 'aktywny',
        amountLabel: '—',
      })
    })

    it('disputed → spór, brak kwoty', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'disputed' }, 0, false, null)).toEqual({
        badge: 'spór',
        amountLabel: '—',
      })
    })
  })

  describe('zakłady zakończone', () => {
    it('wygrany 50 j. → badge wygrany, +50 j.', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'completed' }, 50, true, null)).toEqual({
        badge: 'wygrany',
        amountLabel: '+50 j.',
      })
    })

    it('przegrany 30 j. → badge przegrany, -30 j.', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'completed' }, -30, true, null)).toEqual({
        badge: 'przegrany',
        amountLabel: '-30 j.',
      })
    })

    it('completed bez rozliczenia (stake_mode none) → zakończony, bez stawki', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'completed' }, 0, false, null)).toEqual({
        badge: 'zakończony',
        amountLabel: 'bez stawki',
      })
    })

    it('completed z rozliczeniem ale profit 0 → zakończony, 0 j.', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'completed' }, 0, true, null)).toEqual({
        badge: 'zakończony',
        amountLabel: '0 j.',
      })
    })
  })

  describe('zakład anulowany', () => {
    it('cancelled → anulowany, bez rozliczenia', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'cancelled' }, 0, false, null)).toEqual({
        badge: 'anulowany',
        amountLabel: 'bez rozliczenia',
      })
    })
  })
})

describe('getFriendsBalanceLeaderboard', () => {
  beforeEach(() => mockGetBalancesScreenData.mockReset())

  it('woła to samo RPC co ekran Bilanse (getBalancesScreenData), nie duplikuje logiki', async () => {
    mockGetBalancesScreenData.mockResolvedValue([])

    await getFriendsBalanceLeaderboard('user-1')

    expect(mockGetBalancesScreenData).toHaveBeenCalledWith('user-1')
  })

  it('zawęża do aktywnych znajomych (isFriend), ale NIE gubi reszty danych — po prostu ich nie pokazuje w rankingu', async () => {
    mockGetBalancesScreenData.mockResolvedValue([
      balRow({ id: 'friend-1', nick: 'Ola', balance: 20, isFriend: true }),
      balRow({ id: 'ghost-1', nick: 'Usunięty użytkownik', balance: 999, isFriend: false }),
      balRow({ id: 'friend-2', nick: 'Kuba', balance: -5, isFriend: true }),
    ])

    const result = await getFriendsBalanceLeaderboard('user-1')

    expect(result.map(r => r.id)).toEqual(['friend-1', 'friend-2'])
    expect(result.find(r => r.id === 'ghost-1')).toBeUndefined()
  })

  it('sortuje malejąco po saldzie', async () => {
    mockGetBalancesScreenData.mockResolvedValue([
      balRow({ id: 'a', balance: -10, isFriend: true }),
      balRow({ id: 'b', balance: 30, isFriend: true }),
      balRow({ id: 'c', balance: 5, isFriend: true }),
    ])

    const result = await getFriendsBalanceLeaderboard('user-1')

    expect(result.map(r => r.balance)).toEqual([30, 5, -10])
  })

  it('mapuje na FriendRankRow (id, nick, balance) — bez avatarUrl / matchCount', async () => {
    mockGetBalancesScreenData.mockResolvedValue([
      balRow({ id: 'f1', nick: 'Ola', avatarUrl: 'http://a', balance: 7, matchCount: 3, isFriend: true }),
    ])

    const result = await getFriendsBalanceLeaderboard('user-1')

    expect(result).toEqual([{ id: 'f1', nick: 'Ola', balance: 7 }])
  })

  it('pusty wynik → pusta lista (bez wczesnego return po friends.length)', async () => {
    mockGetBalancesScreenData.mockResolvedValue([])

    await expect(getFriendsBalanceLeaderboard('user-1')).resolves.toEqual([])
  })

  it('błąd propaguje się z getBalancesScreenData (fail-closed)', async () => {
    mockGetBalancesScreenData.mockRejectedValue(new Error('rpc down'))

    await expect(getFriendsBalanceLeaderboard('user-1')).rejects.toThrow('rpc down')
  })
})
