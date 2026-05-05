import { act, renderHook, waitFor } from '@testing-library/react-native'

jest.mock('../../contexts/AuthContext', () => ({
  useAuthContext: jest.fn(),
}))

jest.mock('../../services/bets.service', () => ({
  BetsService: {
    getUserBetSummaries: jest.fn(),
    createBet: jest.fn(),
  },
}))

import { useAuthContext } from '../../contexts/AuthContext'
import { BetsService } from '../../services/bets.service'
import { supabase } from '../../lib/supabase'
import { useBets } from '../../hooks/useBets'

describe('useBets', () => {
  const mockRemoveChannel = jest.fn()
  const mockSubscribe = jest.fn()
  const mockOn = jest.fn(() => ({ subscribe: mockSubscribe }))
  const mockChannel = { on: mockOn, subscribe: mockSubscribe }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthContext as jest.Mock).mockReturnValue({ userId: 'u1' })
    ;(supabase.channel as jest.Mock).mockImplementation(() => mockChannel)
    ;(supabase.removeChannel as jest.Mock).mockImplementation(mockRemoveChannel)
    ;(BetsService.getUserBetSummaries as jest.Mock).mockResolvedValue([
      { id: 'b1', status: 'active' },
      { id: 'b2', status: 'completed' },
      { id: 'b3', status: 'pending' },
    ])
  })

  it('should fetch bets and expose loading state transitions', async () => {
    // Arrange
    const { result } = renderHook(() => useBets())

    // Act
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Assert
    expect(result.current.bets).toHaveLength(3)
  })

  it('should filter activeBets by status', async () => {
    // Arrange
    const { result } = renderHook(() => useBets())

    // Act
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Assert
    expect(result.current.activeBets).toHaveLength(2)
    expect(result.current.activeBets.map(b => b.id)).toEqual(['b1', 'b3'])
  })

  it('should return empty list when user is missing', async () => {
    // Arrange
    ;(useAuthContext as jest.Mock).mockReturnValue({ userId: null })

    // Act
    const { result } = renderHook(() => useBets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Assert
    expect(result.current.bets).toEqual([])
  })

  it('should set error when fetch fails', async () => {
    // Arrange
    ;(BetsService.getUserBetSummaries as jest.Mock).mockRejectedValue(new Error('network fail'))

    // Act
    const { result } = renderHook(() => useBets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Assert
    expect(result.current.error).toBe('network fail')
  })

  it('should refresh when realtime status update changes bet to active lifecycle status', async () => {
    // Arrange
    let realtimeHandler: ((payload: { old: { status: string }; new: { status: string } }) => void) | null = null
    mockOn.mockImplementation((_evt, _filter, handler) => {
      realtimeHandler = handler
      return { subscribe: mockSubscribe }
    })
    const { result } = renderHook(() => useBets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Act
    await act(async () => {
      realtimeHandler?.({ old: { status: 'pending' }, new: { status: 'active' } })
    })

    // Assert
    expect(BetsService.getUserBetSummaries).toHaveBeenCalledTimes(2)
  })
})
