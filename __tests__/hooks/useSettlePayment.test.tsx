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
  // mockReset() też czyści historię wywołań między testami — inaczej asercje
  // "nie wołano Alert.alert('Zapisano')" łapałyby wywołanie z sąsiedniego testu.
  jest.spyOn(Alert, 'alert').mockReset().mockImplementation(() => {})
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

  it('wpis dłużnika (status "pending"): feedback "Wysłano do potwierdzenia", nie "Zapisano"', async () => {
    mockRecordPayment.mockResolvedValue({ status: 'pending' })
    const onSettled = jest.fn().mockResolvedValue(undefined)
    const { Wrapper } = createWrapper()
    const { result, unmount } = renderHook(() => useSettlePayment('friend-1', onSettled), { wrapper: Wrapper })
    cleanup = unmount

    await act(async () => {
      await result.current.settle(50, -30) // balance < 0 → to ja jestem dłużnikiem
    })

    expect(Alert.alert).toHaveBeenCalledWith(
      'Wysłano do potwierdzenia',
      expect.stringContaining('potwierdzić'),
    )
    expect(Alert.alert).not.toHaveBeenCalledWith('Zapisano', expect.anything())
  })

  it('wpis wierzyciela (status "confirmed"): feedback "Zapisano"', async () => {
    mockRecordPayment.mockResolvedValue({ status: 'confirmed' })
    const onSettled = jest.fn().mockResolvedValue(undefined)
    const { Wrapper } = createWrapper()
    const { result, unmount } = renderHook(() => useSettlePayment('friend-1', onSettled), { wrapper: Wrapper })
    cleanup = unmount

    await act(async () => {
      await result.current.settle(50, 30)
    })

    expect(Alert.alert).toHaveBeenCalledWith('Zapisano', expect.any(String))
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

  // [bug-fix] settle() miał lukę: nie sprawdzał własnego stanu "w trakcie"
  // przed startem, więc dwa nakładające się wywołania (np. dwa szybkie
  // kliknięcia zanim UI zdąży się zablokować) wywoływały recordPayment dwa
  // razy — realne ryzyko podwójnej płatności. Poprawka: settlingRef (ref,
  // nie tylko stan `settling` — `settle` jest zamemoizowane przez
  // useCallback bez `settling` w deps, więc odczyt stanu w domknięciu byłby
  // zawsze nieaktualny) blokuje drugie wywołanie synchronicznie, zanim
  // pierwsze zdąży się zakończyć.
  it('[bug-fix] drugie wywołanie settle() w trakcie trwania pierwszego jest ignorowane — recordPayment leci tylko raz', async () => {
    let resolveFirst: (value: { error?: string }) => void = () => {}
    mockRecordPayment.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
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

    // Drugie wywołanie musi zostać zignorowane NATYCHMIAST (przed
    // rozstrzygnięciem pierwszego) — inaczej ochrona nie chroniłaby przed
    // dwoma kliknięciami tuż po sobie.
    await expect(secondCall).resolves.toBe(false)
    expect(mockRecordPayment).toHaveBeenCalledTimes(1)
    expect(onSettled).not.toHaveBeenCalled()

    resolveFirst({})
    await act(async () => {
      await firstCall
    })

    expect(mockRecordPayment).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledTimes(1)
  })

  it('po zakończeniu poprzedniego settle() kolejne wywołanie znów działa normalnie (ochrona nie blokuje na stałe)', async () => {
    mockRecordPayment.mockResolvedValue({})
    const onSettled = jest.fn().mockResolvedValue(undefined)
    const { Wrapper } = createWrapper()
    const { result, unmount } = renderHook(() => useSettlePayment('friend-1', onSettled), { wrapper: Wrapper })
    cleanup = unmount

    await act(async () => {
      await result.current.settle(50, 30)
    })

    let secondReturn: boolean | undefined
    await act(async () => {
      secondReturn = await result.current.settle(20, 30)
    })

    expect(secondReturn).toBe(true)
    expect(mockRecordPayment).toHaveBeenCalledTimes(2)
  })
})
