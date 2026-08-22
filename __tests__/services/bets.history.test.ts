import { chainResponse } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import { getUserBets } from '@/features/bets/api/bets.userBets'
import { historyBadgeAndAmount, getHistoryForUser } from '@/features/bets/api/bets.history'
import type { BetSummary } from '@/features/bets/types/bet.types'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})
jest.mock('@/features/friends', () => ({ loadNicksByIds: jest.fn() }))
jest.mock('@/features/bets/api/bets.userBets', () => ({ getUserBets: jest.fn() }))

const mockFrom = supabase.from as jest.Mock
const mockGetUserBets = getUserBets as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
  mockGetUserBets.mockReset()
})

describe('historyBadgeAndAmount', () => {
  it('status "pending" → badge "oczekuje", kwota "—"', () => {
    const result = historyBadgeAndAmount({ status: 'pending' }, 0, false, null)

    expect(result).toEqual({ badge: 'oczekuje', amountLabel: '—' })
  })

  it('status "rejected" → badge "odrzucony"', () => {
    const result = historyBadgeAndAmount({ status: 'rejected' }, 0, false, null)

    expect(result.badge).toBe('odrzucony')
  })

  it('status "disputed" → badge "spór"', () => {
    const result = historyBadgeAndAmount({ status: 'disputed' }, 0, false, null)

    expect(result.badge).toBe('spór')
  })

  it('status "active" → badge "aktywny"', () => {
    const result = historyBadgeAndAmount({ status: 'active' }, 0, false, null)

    expect(result.badge).toBe('aktywny')
  })

  it('status "awaiting_confirmation" → badge "aktywny"', () => {
    const result = historyBadgeAndAmount({ status: 'awaiting_confirmation' }, 0, false, null)

    expect(result.badge).toBe('aktywny')
  })

  it('status "completed" z profit > 0 → badge "wygrany" i kwota z plusem', () => {
    const result = historyBadgeAndAmount({ status: 'completed' }, 50, true, null)

    expect(result).toEqual({ badge: 'wygrany', amountLabel: '+50 j.' })
  })

  it('status "completed" z profit < 0 → badge "przegrany"', () => {
    const result = historyBadgeAndAmount({ status: 'completed' }, -50, true, null)

    expect(result).toEqual({ badge: 'przegrany', amountLabel: '-50 j.' })
  })

  it('status "completed" bez rozliczenia (zakład honorowy) → badge "zakończony", kwota "bez stawki"', () => {
    const result = historyBadgeAndAmount({ status: 'completed' }, 0, false, null)

    expect(result).toEqual({ badge: 'zakończony', amountLabel: 'bez stawki' })
  })

  it('status "cancelled" → badge "anulowany", kwota "bez rozliczenia"', () => {
    const result = historyBadgeAndAmount({ status: 'cancelled' }, 0, false, null)

    expect(result).toEqual({ badge: 'anulowany', amountLabel: 'bez rozliczenia' })
  })
})

const NOW = '2026-08-21T12:00:00.000Z'
const NOW_MS = new Date(NOW).getTime()

function makeBet(overrides: Partial<BetSummary>): BetSummary {
  return {
    id: 'bet-x',
    creatorId: 'user-1',
    gameTemplate: 'FIFA',
    format: 'single',
    stakeMode: 'equal',
    status: 'active',
    createdAt: NOW,
    ...overrides,
  }
}

function hoursAgoIso(hours: number): string {
  return new Date(NOW_MS - hours * 60 * 60 * 1000).toISOString()
}

// Wiek graniczny (24h) jest weryfikowany osobnym mutation-checkiem (patrz PR)
// — dlatego "młodszy" test celowo trzyma się blisko granicy (23h), żeby
// przesunięcie progu o godzinę faktycznie złapał ten test, a nie tylko
// "stary" przypadek, który jest bezpiecznie daleko od granicy.
describe('getHistoryForUser — widoczność zakładów rejected (filtr 24h) i cancelled', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('zakład rejected młodszy niż 24h → widoczny w historii', async () => {
    jest.useFakeTimers().setSystemTime(new Date(NOW))
    mockGetUserBets.mockResolvedValueOnce([
      makeBet({ id: 'bet-young', status: 'rejected', rejectedAt: hoursAgoIso(23) }),
      makeBet({ id: 'bet-old', status: 'rejected', rejectedAt: hoursAgoIso(25) }),
    ])
    mockFrom
      .mockReturnValueOnce(chainResponse({ data: [], error: null }))
      .mockReturnValueOnce(chainResponse({ data: [], error: null }))

    const result = await getHistoryForUser('user-1')

    expect(result.map(i => i.id)).toEqual(['bet-young'])
  })

  it('zakład rejected starszy niż 24h → ukryty', async () => {
    jest.useFakeTimers().setSystemTime(new Date(NOW))
    mockGetUserBets.mockResolvedValueOnce([
      makeBet({ id: 'bet-old', status: 'rejected', rejectedAt: hoursAgoIso(25) }),
    ])

    const result = await getHistoryForUser('user-1')

    expect(result).toEqual([])
  })

  it('zakład cancelled → zawsze widoczny niezależnie od wieku (świadoma decyzja, patrz migracja 20260812130000_add_cancelled_bet_status.sql)', async () => {
    jest.useFakeTimers().setSystemTime(new Date(NOW))
    mockGetUserBets.mockResolvedValueOnce([
      makeBet({ id: 'bet-cancelled-old', status: 'cancelled', createdAt: '2016-08-21T12:00:00.000Z' }),
    ])
    mockFrom
      .mockReturnValueOnce(chainResponse({ data: [], error: null }))
      .mockReturnValueOnce(chainResponse({ data: [], error: null }))

    const result = await getHistoryForUser('user-1')

    expect(result.map(i => i.id)).toEqual(['bet-cancelled-old'])
  })
})
