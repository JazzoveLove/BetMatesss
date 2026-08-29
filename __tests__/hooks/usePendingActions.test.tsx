import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePendingActions } from '@/features/actions/hooks/usePendingActions'
import { getPendingActions } from '@/features/actions/api/actions.pending'
import type { PendingAction } from '@/features/actions/types/action.types'

jest.mock('@/features/auth', () => ({
  useAuthContext: () => ({ userId: 'user-1' }),
}))

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}))

jest.mock('@/features/actions/api/actions.pending', () => ({
  getPendingActions: jest.fn(),
}))

const mockGetPendingActions = getPendingActions as jest.Mock

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function action(kind: PendingAction['kind'], betId: string): PendingAction {
  return {
    kind,
    betId,
    otherId: 'user-2',
    otherNickname: 'Kuba',
    otherAvatarUrl: null,
    gameTemplate: 'pilkarzyki',
    stake: null,
    createdAt: '2026-08-20T10:00:00.000Z',
  }
}

let cleanup: (() => void) | null = null

beforeEach(() => {
  mockGetPendingActions.mockReset()
})

afterEach(() => {
  cleanup?.()
  cleanup = null
})

describe('usePendingActions', () => {
  it('pusta odpowiedź → items puste, counts wyzerowane, bez isError', async () => {
    mockGetPendingActions.mockResolvedValue([])
    const { result, unmount } = renderHook(() => usePendingActions(), { wrapper: createWrapper() })
    cleanup = unmount

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.items).toEqual([])
    expect(result.current.counts).toEqual({ total: 0, bet_invite: 0, result_confirm: 0, dispute: 0 })
    expect(result.current.isError).toBe(false)
  })

  it('grupuje liczniki per kind i sumuje total', async () => {
    mockGetPendingActions.mockResolvedValue([
      action('bet_invite', 'bet-1'),
      action('result_confirm', 'bet-2'),
      action('result_confirm', 'bet-3'),
      action('dispute', 'bet-4'),
    ])
    const { result, unmount } = renderHook(() => usePendingActions(), { wrapper: createWrapper() })
    cleanup = unmount

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.items).toHaveLength(4)
    expect(result.current.counts).toEqual({ total: 4, bet_invite: 1, result_confirm: 2, dispute: 1 })
  })

  it('błąd RPC → isError true, a NIE pusta lista udająca "wszystko ogarnięte"', async () => {
    mockGetPendingActions.mockRejectedValue(new Error('rpc down'))
    const { result, unmount } = renderHook(() => usePendingActions(), { wrapper: createWrapper() })
    cleanup = unmount

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.isError).toBe(true)
    // items jest technicznie [], ale sygnałem jest isError — to konsument (3b)
    // ma pokazać błąd, nie stan "brak spraw".
    expect(result.current.loading).toBe(false)
  })

  it('trwające ładowanie nie jest mylone ze stanem "brak spraw"', () => {
    mockGetPendingActions.mockReturnValue(new Promise(() => {}))
    const { result, unmount } = renderHook(() => usePendingActions(), { wrapper: createWrapper() })
    cleanup = unmount

    expect(result.current.loading).toBe(true)
    expect(result.current.isError).toBe(false)
    expect(result.current.items).toEqual([])
  })
})
