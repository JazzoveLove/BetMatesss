import React from 'react'
import { Alert } from 'react-native'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBetInvites } from '@/features/bets/hooks/useBetInvites'
import { BetsService } from '@/features/bets/api'
import { NotificationsService, type BetInviteNotification } from '@/shared/lib/notifications.service'

jest.mock('@/features/auth', () => ({
  useAuthContext: () => ({ userId: 'user-1' }),
}))

jest.mock('@/features/bets/api', () => ({
  BetsService: {
    confirmParticipation: jest.fn(),
    rejectParticipation: jest.fn(),
  },
}))

jest.mock('@/shared/lib/notifications.service', () => ({
  NotificationsService: {
    getPendingBetInviteNotifications: jest.fn().mockResolvedValue([]),
    markNotificationRead: jest.fn(),
  },
}))

const mockConfirm = BetsService.confirmParticipation as jest.Mock
const mockReject = BetsService.rejectParticipation as jest.Mock
const mockMarkRead = NotificationsService.markNotificationRead as jest.Mock

const invite: BetInviteNotification = {
  id: 'notif-1',
  betId: 'bet-1',
  fromUserId: 'user-2',
  fromNick: 'Kuba',
  gameTemplate: 'FIFA',
  stakeAmount: 10,
  message: 'Kuba zaprasza cię do zakładu',
  createdAt: '2026-08-18T10:00:00Z',
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

let cleanup: (() => void) | null = null

beforeEach(() => {
  mockConfirm.mockReset()
  mockReject.mockReset()
  mockMarkRead.mockReset()
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

afterEach(() => {
  // renderHook + React Query zostawia aktywne subskrypcje (focusManager itp.)
  // dopóki hook nie zostanie odmontowany — bez tego Jest wisi po testach
  // ("did not exit one second after the test run"). Bez znaczenia dla
  // pojedynczego pliku, ale krytyczne przy 10+ takich plikach w suite.
  cleanup?.()
  cleanup = null
})

// Kontrakt: accept/reject mają dwa efekty uboczne, które muszą zajść razem
// albo wcale — zmiana stanu uczestnictwa w bazie i oznaczenie powiadomienia
// jako przeczytane. Jeśli operacja w bazie się nie uda, powiadomienie NIE
// może zniknąć z listy zaproszeń (user straciłby zaproszenie mimo że nic
// się nie stało) — to ta sama klasa buga co P0-1/P0-2, tylko po stronie hooka.
describe('useBetInvites / acceptBetInvite', () => {
  it('sukces: confirmParticipation ok -> markNotificationRead zostaje wywołane', async () => {
    mockConfirm.mockResolvedValue({})
    const { result, unmount } = renderHook(() => useBetInvites(), { wrapper: createWrapper() })
    cleanup = unmount

    await act(async () => {
      await result.current.acceptBetInvite(invite)
    })

    await waitFor(() => expect(mockMarkRead).toHaveBeenCalledWith('notif-1'))
    expect(mockConfirm).toHaveBeenCalledWith('bet-1', 'user-1')
  })

  it('porażka: confirmParticipation zwraca error -> markNotificationRead NIE zostaje wywołane', async () => {
    // Ten test celowo wywołuje ścieżkę błędu, która loguje przez logger.error
    // (console.error) — to zamierzone zachowanie hooka przy porażce
    // confirmParticipation, nie bug. Wyciszamy, żeby jest-fail-on-console nie
    // wysypał testu za oczekiwany log.
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockConfirm.mockResolvedValue({ error: 'Nie udało się dołączyć.' })
    const { result, unmount } = renderHook(() => useBetInvites(), { wrapper: createWrapper() })
    cleanup = unmount

    await act(async () => {
      await result.current.acceptBetInvite(invite)
    })

    await waitFor(() => expect(mockConfirm).toHaveBeenCalledTimes(1))
    expect(mockMarkRead).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})

describe('useBetInvites / rejectBetInvite', () => {
  it('sukces: rejectParticipation ok -> markNotificationRead zostaje wywołane', async () => {
    mockReject.mockResolvedValue({})
    const { result, unmount } = renderHook(() => useBetInvites(), { wrapper: createWrapper() })
    cleanup = unmount

    await act(async () => {
      await result.current.rejectBetInvite(invite)
    })

    await waitFor(() => expect(mockMarkRead).toHaveBeenCalledWith('notif-1'))
    expect(mockReject).toHaveBeenCalledWith('bet-1', 'user-1')
  })

  it('porażka: rejectParticipation zwraca error -> markNotificationRead NIE zostaje wywołane', async () => {
    // Jak wyżej: rejectBetInvite przy błędzie celowo loguje przez logger.error
    // (console.error) — wyciszamy tylko oczekiwany log, nie ukrywamy problemu.
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockReject.mockResolvedValue({ error: 'Nie jesteś uczestnikiem tego zakładu.' })
    const { result, unmount } = renderHook(() => useBetInvites(), { wrapper: createWrapper() })
    cleanup = unmount

    await act(async () => {
      await result.current.rejectBetInvite(invite)
    })

    await waitFor(() => expect(mockReject).toHaveBeenCalledTimes(1))
    expect(mockMarkRead).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})
