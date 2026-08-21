import { chainResponse } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import { getDashboardData } from '@/features/bets/api/bets.dashboard'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})
jest.mock('@/features/friends', () => ({ loadNicksByIds: jest.fn().mockResolvedValue({}) }))

const mockFrom = supabase.from as jest.Mock
const mockRpc = supabase.rpc as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
  mockRpc.mockReset()
})

// Kolejność wywołań w getDashboardData (Promise.all): users → bet_participants
// → settlements → rpc(get_balances_with_friends). `balance` liczy się
// wyłącznie z tego RPC (linia `balances.reduce(...)`) — testy poniżej
// weryfikują właśnie to, żeby przyszły refaktor nie zaczął po cichu liczyć
// bilansu z lokalnych bet_participants/settlements zamiast z serwera.
function mockPipeline(opts: {
  profile?: { data: unknown; error: unknown }
  participations?: { data: unknown; error: unknown }
  settlements?: { data: unknown; error: unknown }
  balances?: { data: unknown; error: unknown }
}) {
  mockFrom
    .mockReturnValueOnce(chainResponse(opts.profile ?? { data: { nick: 'Kuba' }, error: null }))
    .mockReturnValueOnce(chainResponse(opts.participations ?? { data: [], error: null }))
    .mockReturnValueOnce(chainResponse(opts.settlements ?? { data: [], error: null }))
  mockRpc.mockResolvedValueOnce(opts.balances ?? { data: [], error: null })
}

describe('getDashboardData', () => {
  it('poprawna agregacja bilansu: suma należności minus zobowiązania z get_balances_with_friends', async () => {
    mockPipeline({
      balances: {
        data: [
          { other_id: 'user-2', balance: 50 },
          { other_id: 'user-3', balance: -20 },
        ],
        error: null,
      },
    })

    const result = await getDashboardData('user-1')

    expect(result.stats.balance).toBe(30)
  })

  it('zakład cancelled z rozliczeniem w tle NIE wchodzi do bilansu — balance liczy się tylko z RPC, nie z lokalnych settlements', async () => {
    mockPipeline({
      participations: {
        data: [
          {
            stake_amount: 100,
            odds: 2,
            bets: {
              id: 'bet-cancelled',
              game_template: 'FIFA',
              status: 'cancelled',
              created_at: '2026-08-01T00:00:00Z',
              bet_participants: [
                { user_id: 'user-1', users: { nick: 'Kuba', deleted_at: null } },
                { user_id: 'user-2', users: { nick: 'Ola', deleted_at: null } },
              ],
            },
          },
        ],
        error: null,
      },
      // Rozliczenie powiązane z anulowanym zakładem — gdyby balance liczył
      // się z tego, wynik byłby 500, a nie 30.
      settlements: {
        data: [{ id: 's-1', amount: 500, debtor_id: 'user-2', creditor_id: 'user-1', bet_id: 'bet-cancelled' }],
        error: null,
      },
      balances: { data: [{ other_id: 'user-2', balance: 30 }], error: null },
    })

    const result = await getDashboardData('user-1')

    expect(result.stats.balance).toBe(30)
  })

  it('brak zakładów i brak bilansów → same zera, nie undefined/NaN', async () => {
    mockPipeline({})

    const result = await getDashboardData('user-1')

    expect(result.stats).toEqual({
      balance: 0,
      totalBets: 0,
      winRate: 0,
      wins: 0,
      losses: 0,
      totalMatches: 0,
    })
    expect(result.activeBets).toEqual([])
    expect(result.recentResults).toEqual([])
  })

  it('błąd w dowolnym z równoległych zapytań → fail-closed (funkcja rzuca, nie zwraca częściowych danych)', async () => {
    mockPipeline({ participations: { data: null, error: { message: 'participations failed' } } })

    await expect(getDashboardData('user-1')).rejects.toEqual({ message: 'participations failed' })
  })
})
