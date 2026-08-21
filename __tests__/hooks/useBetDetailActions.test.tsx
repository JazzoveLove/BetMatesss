import { Alert } from 'react-native'
import { act, renderHook } from '@testing-library/react-native'
import { useBetDetailActions } from '@/features/bets/hooks/useBetDetailActions'
import { BetsService } from '@/features/bets/api'
import type { BetDetail, PendingResult } from '@/features/bets/types/bet.types'

jest.mock('@/features/bets/api', () => ({
  BetsService: {
    submitBetResult: jest.fn(),
    confirmBetResult: jest.fn(),
    disputeBetResult: jest.fn(),
    cancelDisputedBet: jest.fn(),
    confirmParticipation: jest.fn(),
    rejectParticipation: jest.fn(),
  },
}))

const mockSubmitBetResult = BetsService.submitBetResult as jest.Mock
const mockConfirmBetResult = BetsService.confirmBetResult as jest.Mock
const mockDisputeBetResult = BetsService.disputeBetResult as jest.Mock
const mockCancelDisputedBet = BetsService.cancelDisputedBet as jest.Mock
const mockConfirmParticipation = BetsService.confirmParticipation as jest.Mock
const mockRejectParticipation = BetsService.rejectParticipation as jest.Mock

const bet: BetDetail = {
  id: 'bet-1',
  creatorId: 'user-1',
  gameTemplate: 'FIFA',
  format: 'single',
  stakeMode: 'equal',
  status: 'awaiting_confirmation',
  createdAt: '2026-08-01T00:00:00Z',
  participants: [],
  results: [],
}

const pendingResult: PendingResult = {
  id: 'res-1',
  winnerId: 'user-1',
  score: '11:7',
  recordedBy: 'user-1',
  confirmed: false,
}

let cleanup: (() => void) | null = null

beforeEach(() => {
  mockSubmitBetResult.mockReset()
  mockConfirmBetResult.mockReset()
  mockDisputeBetResult.mockReset()
  mockCancelDisputedBet.mockReset()
  mockConfirmParticipation.mockReset()
  mockRejectParticipation.mockReset()
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
})

afterEach(() => {
  cleanup?.()
  cleanup = null
})

function setupHook(overrides: { score?: string } = {}) {
  const setScore = jest.fn()
  const setAction = jest.fn()
  const loadData = jest.fn().mockResolvedValue(undefined)
  const { result, unmount } = renderHook(() =>
    useBetDetailActions(
      'bet-1',
      bet,
      'user-2',
      pendingResult,
      overrides.score ?? '11:7',
      setScore,
      setAction,
      loadData,
    ),
  )
  cleanup = unmount
  return { result, setScore, setAction, loadData }
}

// Ta warstwa woła wyłącznie funkcje z bets.resolve.results.ts (już
// przetestowane niżej w stosie) i bets.participants.ts — tu sprawdzamy
// TYLKO reakcję hooka na wynik: czy loadData() (refetch) faktycznie
// zachodzi przy sukcesie i NIE zachodzi przy porażce, i czy błąd trafia do
// UI przez Alert.alert. Logika biznesowa serwisów nie jest tu powtarzana.
describe('useBetDetailActions / submitResult', () => {
  it('sukces → loadData (refetch) wywołane', async () => {
    mockSubmitBetResult.mockResolvedValue({})
    const { result, loadData } = setupHook()

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.submitResult('user-1', '11:7')
    })

    expect(returned).toBe(true)
    expect(loadData).toHaveBeenCalledTimes(1)
  })

  it('porażka → loadData NIE wywołane, błąd trafia do UI przez Alert.alert', async () => {
    mockSubmitBetResult.mockResolvedValue({ error: 'Nie udało się zapisać wyniku.' })
    const { result, loadData } = setupHook()

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.submitResult('user-1', '11:7')
    })

    expect(returned).toBe(false)
    expect(loadData).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Nie udało się zapisać wyniku.')
  })
})

describe('useBetDetailActions / confirmResult', () => {
  it('sukces → loadData (refetch) wywołane', async () => {
    mockConfirmBetResult.mockResolvedValue({})
    const { result, loadData } = setupHook()

    await act(async () => {
      await result.current.confirmResult()
    })

    expect(loadData).toHaveBeenCalledTimes(1)
  })

  it('porażka → loadData NIE wywołane, błąd trafia do UI przez Alert.alert', async () => {
    mockConfirmBetResult.mockResolvedValue({ error: 'Nie udało się potwierdzić wyniku.' })
    const { result, loadData } = setupHook()

    await act(async () => {
      await result.current.confirmResult()
    })

    expect(loadData).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Nie udało się potwierdzić wyniku.')
  })
})

describe('useBetDetailActions / disputeResult', () => {
  it('sukces → loadData (refetch) wywołane', async () => {
    mockDisputeBetResult.mockResolvedValue({})
    const { result, loadData } = setupHook()

    await act(async () => {
      await result.current.disputeResult()
    })

    expect(loadData).toHaveBeenCalledTimes(1)
  })

  it('porażka → loadData NIE wywołane, błąd trafia do UI przez Alert.alert', async () => {
    mockDisputeBetResult.mockResolvedValue({ error: 'Nie udało się zakwestionować wyniku.' })
    const { result, loadData } = setupHook()

    await act(async () => {
      await result.current.disputeResult()
    })

    expect(loadData).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Nie udało się zakwestionować wyniku.')
  })
})

describe('useBetDetailActions / cancelBet', () => {
  it('sukces → loadData (refetch) wywołane', async () => {
    mockCancelDisputedBet.mockResolvedValue({})
    const { result, loadData } = setupHook()

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.cancelBet()
    })

    expect(returned).toBe(true)
    expect(loadData).toHaveBeenCalledTimes(1)
  })

  it('porażka → loadData NIE wywołane, błąd trafia do UI przez Alert.alert', async () => {
    mockCancelDisputedBet.mockResolvedValue({ error: 'Nie udało się anulować zakładu.' })
    const { result, loadData } = setupHook()

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.cancelBet()
    })

    expect(returned).toBe(false)
    expect(loadData).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Nie udało się anulować zakładu.')
  })
})

describe('useBetDetailActions / acceptBet', () => {
  it('sukces → loadData (refetch) wywołane', async () => {
    mockConfirmParticipation.mockResolvedValue({})
    const { result, loadData } = setupHook()

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.acceptBet()
    })

    expect(returned).toBe(true)
    expect(loadData).toHaveBeenCalledTimes(1)
  })

  it('porażka → loadData NIE wywołane, błąd trafia do UI przez Alert.alert', async () => {
    mockConfirmParticipation.mockResolvedValue({ error: 'Nie udało się dołączyć.' })
    const { result, loadData } = setupHook()

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.acceptBet()
    })

    expect(returned).toBe(false)
    expect(loadData).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Nie udało się dołączyć.')
  })
})

describe('useBetDetailActions / rejectBet', () => {
  it('sukces → loadData (refetch) wywołane', async () => {
    mockRejectParticipation.mockResolvedValue({})
    const { result, loadData } = setupHook()

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.rejectBet()
    })

    expect(returned).toBe(true)
    expect(loadData).toHaveBeenCalledTimes(1)
  })

  it('porażka → loadData NIE wywołane, błąd trafia do UI przez Alert.alert', async () => {
    mockRejectParticipation.mockResolvedValue({ error: 'Nie jesteś uczestnikiem tego zakładu.' })
    const { result, loadData } = setupHook()

    let returned: boolean | undefined
    await act(async () => {
      returned = await result.current.rejectBet()
    })

    expect(returned).toBe(false)
    expect(loadData).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Nie jesteś uczestnikiem tego zakładu.')
  })
})
