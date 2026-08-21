import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboard } from '@/features/bets/hooks/useDashboard'
import { BetsService } from '@/features/bets/api'

jest.mock('@/features/auth', () => ({
  useAuthContext: () => ({ userId: 'user-1' }),
}))

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}))

jest.mock('@/features/bets/api', () => ({
  BetsService: {
    getDashboardData: jest.fn(),
  },
}))

const mockGetDashboardData = BetsService.getDashboardData as jest.Mock

function createWrapper() {
  const queryClient = new QueryClient({
    // gcTime: 0 — bez tego react-query zostawia per-query timer na
    // (domyślnie 5-minutowy) garbage collection nawet po unmount, co samo
    // w sobie nie psuje asercji, ale trzyma otwarty event loop Node'a. W
    // pełnym `npm test` maskuje to force-exit workerów Jesta, ale przy
    // pojedynczym pliku (bez workerów) proces wisi w nieskończoność.
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

let cleanup: (() => void) | null = null

beforeEach(() => {
  mockGetDashboardData.mockReset()
})

afterEach(() => {
  cleanup?.()
  cleanup = null
})

describe('useDashboard', () => {
  it('stan ładowania na starcie: loading === true zanim zapytanie się rozstrzygnie', async () => {
    // Promise sterowany ręcznie, nie porzucony na zawsze — jeśli zostanie
    // nierozstrzygnięty po zakończeniu testu, react-query trzyma otwarty
    // fetch i Jest wisi po całym runie (dokładnie ten problem, przed którym
    // ostrzega komentarz w useBetInvites.test.tsx).
    let resolveQuery: (value: unknown) => void = () => {}
    mockGetDashboardData.mockReturnValue(new Promise(resolve => { resolveQuery = resolve }))
    const { result, unmount } = renderHook(() => useDashboard(), { wrapper: createWrapper() })
    cleanup = unmount

    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolveQuery({
        nick: 'Kuba',
        stats: { balance: 0, totalBets: 0, winRate: 0, wins: 0, losses: 0, totalMatches: 0 },
        activeBets: [],
        recentResults: [],
      })
    })
  })

  it('błąd zapytania → loading kończy się na false, stats/activeBets/recentMatches zostają bezpiecznymi wartościami domyślnymi (hook nie eksponuje osobnego stanu error)', async () => {
    mockGetDashboardData.mockRejectedValue(new Error('boom'))
    const { result, unmount } = renderHook(() => useDashboard(), { wrapper: createWrapper() })
    cleanup = unmount

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.stats).toEqual({ wins: 0, losses: 0, winRate: 0, totalMatches: 0, balance: 0 })
    expect(result.current.activeBets).toEqual([])
    expect(result.current.recentMatches).toEqual([])
    expect(result.current.user).toEqual({ nick: '', avatarInitials: '?' })
  })

  it('stan pusty (brak zakładów) → nie crashuje, zera i puste listy zamiast undefined/NaN', async () => {
    mockGetDashboardData.mockResolvedValue({
      nick: 'Kuba',
      stats: { balance: 0, totalBets: 0, winRate: 0, wins: 0, losses: 0, totalMatches: 0 },
      activeBets: [],
      recentResults: [],
    })
    const { result, unmount } = renderHook(() => useDashboard(), { wrapper: createWrapper() })
    cleanup = unmount

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.stats).toEqual({ wins: 0, losses: 0, winRate: 0, totalMatches: 0, balance: 0 })
    expect(result.current.activeBets).toEqual([])
    expect(result.current.recentMatches).toEqual([])
    expect(result.current.user).toEqual({ nick: 'Kuba', avatarInitials: 'KA' })
  })
})
