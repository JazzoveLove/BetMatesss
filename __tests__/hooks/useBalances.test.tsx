import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBalances } from '@/features/balances/hooks/useBalances'
import { getBalancesScreenData } from '@/features/balances/api/balances.queries'

jest.mock('@/features/auth', () => ({
  useAuthContext: () => ({ userId: 'user-1' }),
}))

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}))

jest.mock('@/features/balances/api/balances.queries', () => ({
  getBalancesScreenData: jest.fn(),
}))

const mockGetBalancesScreenData = getBalancesScreenData as jest.Mock

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

let cleanup: (() => void) | null = null

beforeEach(() => {
  mockGetBalancesScreenData.mockReset()
})

afterEach(() => {
  cleanup?.()
  cleanup = null
})

describe('useBalances', () => {
  it('brak znajomych → hasAnyFriends false, items puste', async () => {
    mockGetBalancesScreenData.mockResolvedValue([])
    const { result, unmount } = renderHook(() => useBalances(), { wrapper: createWrapper() })
    cleanup = unmount

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.hasAnyFriends).toBe(false)
    expect(result.current.items).toEqual([])
  })

  it('zmiana filtra przelicza items i summary bez ponownego zapytania do API', async () => {
    mockGetBalancesScreenData.mockResolvedValue([
      { id: '1', nick: 'Ola', avatarUrl: null, balance: 50, matchCount: 2 },
      { id: '2', nick: 'Kuba', avatarUrl: null, balance: -20, matchCount: 1 },
    ])
    const { result, unmount } = renderHook(() => useBalances(), { wrapper: createWrapper() })
    cleanup = unmount

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toHaveLength(2)
    expect(result.current.counts).toEqual({ all: 2, positive: 1, negative: 1, zero: 0 })

    act(() => result.current.setFilter('positive'))

    expect(result.current.filter).toBe('positive')
    expect(result.current.items.map(r => r.id)).toEqual(['1'])
    expect(result.current.summary).toEqual({ filter: 'positive', totalCount: 2, filteredCount: 1, sum: 50 })
    expect(mockGetBalancesScreenData).toHaveBeenCalledTimes(1)
  })
})
