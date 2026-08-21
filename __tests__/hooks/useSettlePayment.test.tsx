import React from 'react'
import { Alert } from 'react-native'
import { act, renderHook } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSettlePayment } from '@/features/friend-detail/hooks/useSettlePayment'
import { recordPayment } from '@/features/friend-detail/api'
import { queryKeys } from '@/shared/lib/queryKeys'

jest.mock('@/features/auth', () => ({
  useAuthContext: () => ({ userId: 'user-1' }),
}))

jest.mock('@/features/friend-detail/api', () => ({
  recordPayment: jest.fn(),
}))

const mockRecordPayment = recordPayment as jest.Mock

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, invalidateSpy }
}

let cleanup: (() => void) | null = null

beforeEach(() => {
  mockRecordPayment.mockReset()
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

afterEach(() => {
  cleanup?.()
  cleanup = null
})

describe('useSettlePayment', () => {
  it('sukces: cache bilansu (dashboard/profile) zostaje zinwalidowany, onSettled wywołane', async () => {
    mockRecordPayment.mockResolvedValue({})
    const onSettled = jest.fn().mockResolvedValue(undefined)
    const { Wrapper, invalidateSpy } = createWrapper()
    const { result, unmount } = renderHook(() => useSettlePayment('friend-1', onSettled), { wrapper: Wrapper })
    cleanup = unmount

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.settle(50, 30)
    })

    expect(returned).toBe(true)
    expect(onSettled).toHaveBeenCalledTimes(1)
    // useSettlePayment sam nie zna klucza queryKeys.friendDetail — odświeżenie
    // salda widocznego na ekranie znajomego dzieje się przez onSettled
    // (przekazywane z ekranu, zwykle jako refetch z useFriendDetail). Ten
    // hook własnoręcznie inwaliduje tylko dashboard i profile.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard('user-1') })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.profile('user-1') })
  })

  it('porażka: cache NIE jest inwalidowany, błąd trafia do UI przez Alert.alert (nie wyjątek, nie stan error)', async () => {
    mockRecordPayment.mockResolvedValue({ error: 'Nie udało się zapisać płatności.' })
    const onSettled = jest.fn()
    const { Wrapper, invalidateSpy } = createWrapper()
    const { result, unmount } = renderHook(() => useSettlePayment('friend-1', onSettled), { wrapper: Wrapper })
    cleanup = unmount

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.settle(50, 30)
    })

    expect(returned).toBe(false)
    expect(onSettled).not.toHaveBeenCalled()
    expect(invalidateSpy).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Nie udało się zapisać płatności.')
  })

  // Finding: settle() nie sprawdza własnego stanu `settling` przed startem,
  // więc nic nie chroni przed dwoma nakładającymi się wywołaniami (np. dwa
  // szybkie kliknięcia zanim UI zdąży się zablokować na `settling`) —
  // poniższy test dokumentuje realne zachowanie, nie zakłada ochrony.
  it('dwa wywołania settle() zanim pierwsze się zakończy → recordPayment leci DWA razy (brak ochrony przed współbieżnością)', async () => {
    let resolveFirst: (value: { error?: string }) => void = () => {}
    mockRecordPayment
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
      .mockResolvedValueOnce({})
    const onSettled = jest.fn().mockResolvedValue(undefined)
    const { Wrapper } = createWrapper()
    const { result, unmount } = renderHook(() => useSettlePayment('friend-1', onSettled), { wrapper: Wrapper })
    cleanup = unmount

    let firstCall!: Promise<boolean>
    let secondCall!: Promise<boolean>
    act(() => {
      firstCall = result.current.settle(50, 30)
      secondCall = result.current.settle(50, 30)
    })
    resolveFirst({})

    await act(async () => {
      await Promise.all([firstCall, secondCall])
    })

    expect(mockRecordPayment).toHaveBeenCalledTimes(2)
  })
})
