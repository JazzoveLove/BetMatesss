import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHistory } from '@/features/bets/hooks/useHistory'
import { BetsService } from '@/features/bets/api'
import type { BetSummary } from '@/features/bets/types/bet.types'
import type { HistoryListItem } from '@/features/bets/types/bet.types'

jest.mock('@/features/auth', () => ({
  useAuthContext: () => ({ userId: 'user-1' }),
}))

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}))

jest.mock('@/features/bets/api', () => ({
  BetsService: {
    getHistoryForUser: jest.fn(),
    getUserBets: jest.fn(),
  },
}))

const mockGetHistoryForUser = BetsService.getHistoryForUser as jest.Mock
const mockGetUserBets = BetsService.getUserBets as jest.Mock

function createWrapper() {
  const queryClient = new QueryClient({
    // gcTime: 0 — bez tego react-query zostawia per-query timer na
    // (domyślnie 5-minutowy) garbage collection nawet po unmount, co samo
    // w sobie nie psuje asercji, ale trzyma otwarty event loop Node'a.
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const activeItem: HistoryListItem = {
  id: 'bet-1',
  gameTemplate: 'pilkarzyki',
  createdAt: '2026-08-01T00:00:00.000Z',
  opponentNick: 'Rywal',
  opponentId: 'friend-1',
  badge: 'aktywny',
  amountLabel: '—',
  profit: 0,
}

const activeBetSummary: BetSummary = {
  id: 'bet-1',
  creatorId: 'user-1',
  gameTemplate: 'pilkarzyki',
  format: 'single',
  stakeMode: 'none',
  status: 'active',
  createdAt: '2026-08-01T00:00:00.000Z',
}

let cleanup: (() => void) | null = null

beforeEach(() => {
  mockGetHistoryForUser.mockReset()
  mockGetUserBets.mockReset()
})

afterEach(() => {
  cleanup?.()
  cleanup = null
})

describe('useHistory — hasAnyBets', () => {
  it('data.items puste → hasAnyBets === false', async () => {
    mockGetHistoryForUser.mockResolvedValue([])
    mockGetUserBets.mockResolvedValue([])
    const { result, unmount } = renderHook(() => useHistory('all'), { wrapper: createWrapper() })
    cleanup = unmount

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.hasAnyBets).toBe(false)
    expect(result.current.items).toEqual([])
  })

  it('hasAnyBets pozostaje true gdy filtr odcina wszystkie wyniki, mimo braku widocznych zakładów', async () => {
    mockGetHistoryForUser.mockResolvedValue([activeItem])
    mockGetUserBets.mockResolvedValue([activeBetSummary])
    const { result, unmount } = renderHook(() => useHistory('completed'), { wrapper: createWrapper() })
    cleanup = unmount

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.items).toEqual([])
    expect(result.current.hasAnyBets).toBe(true)
  })

  it('dane jeszcze nieodpowiedziane (trwa ładowanie) → hasAnyBets === false, nie mylimy stanu ładowania ze stanem "naprawdę pusto"', () => {
    mockGetHistoryForUser.mockReturnValue(new Promise(() => {}))
    mockGetUserBets.mockReturnValue(new Promise(() => {}))
    const { result, unmount } = renderHook(() => useHistory('all'), { wrapper: createWrapper() })
    cleanup = unmount

    expect(result.current.loading).toBe(true)
    expect(result.current.hasAnyBets).toBe(false)
  })

  it('data.items niepuste i filtr coś pokazuje → hasAnyBets === true', async () => {
    mockGetHistoryForUser.mockResolvedValue([activeItem])
    mockGetUserBets.mockResolvedValue([activeBetSummary])
    const { result, unmount } = renderHook(() => useHistory('active'), { wrapper: createWrapper() })
    cleanup = unmount

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.items).toEqual([activeItem])
    expect(result.current.hasAnyBets).toBe(true)
  })
})
