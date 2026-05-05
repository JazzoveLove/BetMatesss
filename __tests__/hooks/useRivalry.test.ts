import { act, renderHook, waitFor } from '@testing-library/react-native'

jest.mock('../../contexts/AuthContext', () => ({
  useAuthContext: jest.fn(),
}))

jest.mock('../../services/rivalry/loadRivalryMatches', () => ({
  fetchRivalryData: jest.fn(),
  RivalryFetchError: class RivalryFetchError extends Error {
    friendNick: string
    constructor(message: string, friendNick: string) {
      super(message)
      this.friendNick = friendNick
    }
  },
}))

import { useAuthContext } from '../../contexts/AuthContext'
import { fetchRivalryData } from '../../services/rivalry/loadRivalryMatches'
import { useRivalry } from '../../hooks/useRivalry'

describe('useRivalry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthContext as jest.Mock).mockReturnValue({ userId: 'me' })
    ;(fetchRivalryData as jest.Mock).mockResolvedValue({
      friendNick: 'Alex',
      matches: [
        {
          betId: 'b1',
          rivalryId: 'r1',
          gameTemplate: 'fifa',
          createdAt: '2026-01-01T00:00:00.000Z',
          score: '2:0',
          stakeAmount: 20,
          profit: 20,
          outcome: 'win',
        },
        {
          betId: 'b2',
          rivalryId: 'r1',
          gameTemplate: 'chess',
          createdAt: '2026-01-02T00:00:00.000Z',
          score: '0:1',
          stakeAmount: 20,
          profit: -20,
          outcome: 'loss',
        },
      ],
      payments: [
        { betId: 'b1', fromUserId: 'me', toUserId: 'friend-1', amount: 20, paymentStatus: 'paid' },
        { betId: 'b2', fromUserId: 'friend-1', toUserId: 'me', amount: 40, paymentStatus: 'paid' },
        { betId: 'b3', fromUserId: 'me', toUserId: 'friend-1', amount: 10, paymentStatus: 'unpaid' },
      ],
    })
  })

  it('should fetch rivalry data and expose initial values', async () => {
    // Arrange
    const { result } = renderHook(() => useRivalry('friend-1'))

    // Act
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Assert
    expect(result.current.friendNick).toBe('Alex')
    expect(result.current.matches).toHaveLength(2)
  })

  it('should compute head-to-head totals from matches', async () => {
    // Arrange
    const { result } = renderHook(() => useRivalry('friend-1'))

    // Act
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Assert
    expect(result.current.totals).toEqual({
      wins: 1,
      losses: 1,
      winRatePct: 50,
      balance: 0,
    })
  })

  it('should build per-discipline breakdown', async () => {
    // Arrange
    const { result } = renderHook(() => useRivalry('friend-1'))

    // Act
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Assert
    expect(result.current.statsByDiscipline).toEqual(
      expect.arrayContaining([
        { gameTemplate: 'fifa', wins: 1, losses: 0 },
        { gameTemplate: 'chess', wins: 0, losses: 1 },
      ]),
    )
  })

  it('should filter matches by selected discipline', async () => {
    // Arrange
    const { result } = renderHook(() => useRivalry('friend-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Act
    act(() => {
      result.current.setSelectedDiscipline('fifa')
    })

    // Assert
    expect(result.current.filteredMatches).toHaveLength(1)
    expect(result.current.filteredMatches[0].gameTemplate).toBe('fifa')
  })

  it('should expose error and clear matches when fetch fails', async () => {
    // Arrange
    ;(fetchRivalryData as jest.Mock).mockRejectedValueOnce(new Error('failed fetch'))

    // Act
    const { result } = renderHook(() => useRivalry('friend-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Assert
    expect(result.current.error).toBe('failed fetch')
    expect(result.current.matches).toEqual([])
  })

  it('paymentSummary should return correct paid totals', async () => {
    const { result } = renderHook(() => useRivalry('friend-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.paymentSummary.totalPaidByMe).toBe(20)
    expect(result.current.paymentSummary.totalPaidByRival).toBe(40)
    expect(result.current.paymentSummary.settledBetsCount).toBe(2)
  })

  it('paymentSummary should set pendingAmount to 0 when everything is settled', async () => {
    ;(fetchRivalryData as jest.Mock).mockResolvedValueOnce({
      friendNick: 'Alex',
      matches: [],
      payments: [
        { betId: 'b1', fromUserId: 'me', toUserId: 'friend-1', amount: 20, paymentStatus: 'paid' },
        { betId: 'b2', fromUserId: 'friend-1', toUserId: 'me', amount: 40, paymentStatus: 'paid' },
      ],
    })
    const { result } = renderHook(() => useRivalry('friend-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.paymentSummary.pendingAmount).toBe(0)
  })

  it('paymentSummary should set pendingStatus to clear when no outstanding debt', async () => {
    ;(fetchRivalryData as jest.Mock).mockResolvedValueOnce({
      friendNick: 'Alex',
      matches: [],
      payments: [
        { betId: 'b1', fromUserId: 'me', toUserId: 'friend-1', amount: 20, paymentStatus: 'paid' },
      ],
    })
    const { result } = renderHook(() => useRivalry('friend-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.paymentSummary.pendingStatus).toBe('clear')
  })

  it('paymentSummary should count paid totals independently for both directions', async () => {
    ;(fetchRivalryData as jest.Mock).mockResolvedValueOnce({
      friendNick: 'Alex',
      matches: [],
      payments: [
        { betId: 'b1', fromUserId: 'me', toUserId: 'friend-1', amount: 10, paymentStatus: 'paid' },
        { betId: 'b2', fromUserId: 'me', toUserId: 'friend-1', amount: 15, paymentStatus: 'paid' },
        { betId: 'b3', fromUserId: 'friend-1', toUserId: 'me', amount: 25, paymentStatus: 'paid' },
      ],
    })
    const { result } = renderHook(() => useRivalry('friend-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.paymentSummary.totalPaidByMe).toBe(25)
    expect(result.current.paymentSummary.totalPaidByRival).toBe(25)
  })
})
