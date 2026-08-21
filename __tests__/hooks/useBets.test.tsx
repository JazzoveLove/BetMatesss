import { renderHook, waitFor, act } from '@testing-library/react-native'
import { useBets } from '@/features/bets/hooks/useBets'
import { BetsService } from '@/features/bets/api'
import { supabase } from '@/shared/lib/supabase'
import type { BetSummary, BetStatus } from '@/features/bets/types/bet.types'

jest.mock('@/features/auth', () => ({
  useAuthContext: () => ({ userId: 'user-1' }),
}))

jest.mock('@/features/bets/api', () => ({
  BetsService: {
    getUserBetSummaries: jest.fn(),
    createBet: jest.fn(),
  },
}))

jest.mock('@/shared/lib/supabase', () => {
  function makeChannel() {
    const channel: Record<string, jest.Mock> = {}
    channel.on = jest.fn(() => channel)
    channel.subscribe = jest.fn((cb?: (status: string) => void) => {
      cb?.('SUBSCRIBED')
      return channel
    })
    return channel
  }
  return {
    supabase: {
      channel: jest.fn(() => makeChannel()),
      removeChannel: jest.fn(),
    },
  }
})

const mockGetUserBetSummaries = BetsService.getUserBetSummaries as jest.Mock
const mockChannel = supabase.channel as jest.Mock
const mockRemoveChannel = supabase.removeChannel as jest.Mock

function betRow(id: string, status: BetStatus): BetSummary {
  return {
    id,
    creatorId: 'user-1',
    gameTemplate: 'FIFA',
    format: 'single',
    stakeMode: 'equal',
    status,
    createdAt: '2026-08-01T00:00:00Z',
  }
}

let cleanup: (() => void) | null = null

beforeEach(() => {
  mockGetUserBetSummaries.mockReset()
  mockChannel.mockClear()
  mockRemoveChannel.mockClear()
})

afterEach(() => {
  cleanup?.()
  cleanup = null
})

describe('useBets / activeBets', () => {
  it('filtrowanie po statusie faktycznie odcina completed/rejected/disputed/cancelled, zostawia tylko pending/active/awaiting_confirmation', async () => {
    // Realny mix statusów zamiast z góry przefiltrowanej listy — dowód, że
    // to WŁASNY filtr hooka (useMemo) robi robotę, a nie że mock zwraca już
    // gotową odpowiedź.
    mockGetUserBetSummaries.mockResolvedValue([
      betRow('b-pending', 'pending'),
      betRow('b-active', 'active'),
      betRow('b-awaiting', 'awaiting_confirmation'),
      betRow('b-completed', 'completed'),
      betRow('b-disputed', 'disputed'),
      betRow('b-rejected', 'rejected'),
      betRow('b-cancelled', 'cancelled'),
    ])

    const { result, unmount } = renderHook(() => useBets())
    cleanup = unmount

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.activeBets.map(b => b.id)).toEqual(['b-pending', 'b-active', 'b-awaiting'])
  })
})

describe('useBets / realtime subskrypcja', () => {
  it('subskrypcja jest poprawnie odpinana przy unmount (removeChannel z dokładnie tym kanałem)', async () => {
    mockGetUserBetSummaries.mockResolvedValue([betRow('b1', 'active')])

    const { result, unmount } = renderHook(() => useBets())
    cleanup = unmount

    await waitFor(() => expect(result.current.loading).toBe(false))
    await waitFor(() => expect(mockChannel).toHaveBeenCalledTimes(1))

    const channelInstance = mockChannel.mock.results[0].value

    act(() => {
      unmount()
    })

    expect(mockRemoveChannel).toHaveBeenCalledWith(channelInstance)
  })
})
