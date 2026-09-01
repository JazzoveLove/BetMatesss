import React from 'react'
import { Alert } from 'react-native'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePairPendingPayments } from '@/features/friend-detail/hooks/usePairPendingPayments'
import {
  confirmPayment,
  getPairPendingPayments,
  rejectPayment,
  retractPayment,
} from '@/features/friend-detail/api'
import { queryKeys } from '@/shared/lib/queryKeys'

jest.mock('@/features/auth', () => ({
  useAuthContext: () => ({ userId: 'user-1' }),
}))

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}))

jest.mock('@/features/friend-detail/api', () => ({
  getPairPendingPayments: jest.fn(),
  confirmPayment: jest.fn(),
  rejectPayment: jest.fn(),
  retractPayment: jest.fn(),
}))

const mockGet = getPairPendingPayments as jest.Mock
const mockConfirm = confirmPayment as jest.Mock
const mockReject = rejectPayment as jest.Mock
const mockRetract = retractPayment as jest.Mock

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { Wrapper, invalidateSpy }
}

let cleanup: (() => void) | null = null

beforeEach(() => {
  mockGet.mockReset().mockResolvedValue([])
  mockConfirm.mockReset().mockResolvedValue({})
  mockReject.mockReset().mockResolvedValue({})
  mockRetract.mockReset().mockResolvedValue({})
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

afterEach(() => {
  cleanup?.()
  cleanup = null
})

describe('usePairPendingPayments', () => {
  it('confirm: woła confirmPayment(id) i inwaliduje friendDetail/dashboard/profile', async () => {
    const { Wrapper, invalidateSpy } = createWrapper()
    const { result, unmount } = renderHook(() => usePairPendingPayments('friend-1'), { wrapper: Wrapper })
    cleanup = unmount

    await waitFor(() => expect(mockGet).toHaveBeenCalled())
    invalidateSpy.mockClear()

    await act(async () => {
      await result.current.confirm('pay-1')
    })

    expect(mockConfirm).toHaveBeenCalledWith('pay-1')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.friendDetail('user-1', 'friend-1') })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard('user-1') })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.profile('user-1') })
  })

  it('reject / retract: kierują do właściwej funkcji API', async () => {
    const { Wrapper } = createWrapper()
    const { result, unmount } = renderHook(() => usePairPendingPayments('friend-1'), { wrapper: Wrapper })
    cleanup = unmount
    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    await act(async () => {
      await result.current.reject('pay-2')
    })
    await act(async () => {
      await result.current.retract('pay-3')
    })

    expect(mockReject).toHaveBeenCalledWith('pay-2')
    expect(mockRetract).toHaveBeenCalledWith('pay-3')
  })

  it('dwa taps w trakcie trwania pierwszej akcji → API wołane tylko raz', async () => {
    let resolveFirst: (value: { error?: string }) => void = () => {}
    mockConfirm.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
    const { Wrapper } = createWrapper()
    const { result, unmount } = renderHook(() => usePairPendingPayments('friend-1'), { wrapper: Wrapper })
    cleanup = unmount
    await waitFor(() => expect(mockGet).toHaveBeenCalled())

    let first!: Promise<void>
    let second!: Promise<void>
    act(() => {
      first = result.current.confirm('pay-1')
      second = result.current.confirm('pay-1')
    })
    await second

    expect(mockConfirm).toHaveBeenCalledTimes(1)

    resolveFirst({})
    await act(async () => {
      await first
    })
  })

  it('błąd akcji → Alert.alert("Błąd", ...), BEZ inwalidacji cache', async () => {
    mockConfirm.mockResolvedValue({ error: 'row-level security' })
    const { Wrapper, invalidateSpy } = createWrapper()
    const { result, unmount } = renderHook(() => usePairPendingPayments('friend-1'), { wrapper: Wrapper })
    cleanup = unmount
    await waitFor(() => expect(mockGet).toHaveBeenCalled())
    invalidateSpy.mockClear()

    await act(async () => {
      await result.current.confirm('pay-1')
    })

    expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'row-level security')
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
