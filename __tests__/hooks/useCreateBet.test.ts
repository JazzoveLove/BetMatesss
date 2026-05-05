import { act, renderHook } from '@testing-library/react-native'
import { Alert } from 'react-native'
import type { UseNewBetStateReturn } from '../../hooks/useNewBetState'
import { useNewBetActions } from '../../hooks/useNewBetActions'

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}))

// TODO: align with implementation when created
describe('useCreateBet (currently covered via useNewBetActions)', () => {
  const navigation = { goBack: jest.fn(), navigate: jest.fn() } as never

  const buildState = (): UseNewBetStateReturn =>
    ({
      step: 1,
      setStep: jest.fn(),
      currentUser: { id: 'u1', nick: 'Me' },
      setCurrentUser: jest.fn(),
      selectedGame: { id: 'fifa' },
      setSelectedGame: jest.fn(),
      participants: [{ id: 'u2', nick: 'Alex' }],
      setParticipants: jest.fn(),
      selectedFormat: 'single',
      setSelectedFormat: jest.fn(),
      bestOfCount: 3,
      setBestOfCount: jest.fn(),
      stakeMode: 'equal',
      setStakeMode: jest.fn(),
      stakeAmount: 25,
      setStakeAmount: jest.fn(),
      customStakes: { u1: 25, u2: 25 },
      setCustomStakes: jest.fn(),
      pokerMode: 'winner_takes_all',
      setPokerMode: jest.fn(),
      pokerStack: 3000,
      setPokerStack: jest.fn(),
      pokerRebuyStack: 1500,
      setPokerRebuyStack: jest.fn(),
      stakePerMatch: 20,
      setStakePerMatch: jest.fn(),
      searchQuery: '',
      setSearchQuery: jest.fn(),
      searchFocused: false,
      setSearchFocused: jest.fn(),
      preselectedFriend: undefined,
    }) as never

  it('should advance wizard to format step after selecting game', () => {
    // Arrange
    const state = buildState()
    const { result } = renderHook(() =>
      useNewBetActions(state, {} as never, navigation, jest.fn(async () => ({}))),
    )

    // Act
    act(() => {
      result.current.handleGameSelect({ id: 'chess' } as never)
    })

    // Assert
    expect(state.setSelectedGame).toHaveBeenCalled()
    expect(state.setStep).toHaveBeenCalledWith(2)
  })

  it('should toggle participant selection in participants step', () => {
    // Arrange
    const state = buildState()
    const { result } = renderHook(() =>
      useNewBetActions(state, {} as never, navigation, jest.fn(async () => ({}))),
    )
    const friend = { id: 'u3', nick: 'Bob' }

    // Act
    act(() => {
      result.current.toggleParticipant(friend as never)
    })

    // Assert
    expect(state.setParticipants).toHaveBeenCalled()
  })

  it('should submit valid wizard payload and navigate home', async () => {
    // Arrange
    const state = buildState()
    const createBet = jest.fn(async () => ({}))
    const { result } = renderHook(() =>
      useNewBetActions(state, {} as never, navigation, createBet),
    )

    // Act
    await act(async () => {
      await result.current.handleSubmit()
    })

    // Assert
    expect(createBet).toHaveBeenCalled()
    expect(navigation.navigate).toHaveBeenCalledWith('Home')
  })

  it('should block submit when required data is missing', async () => {
    // Arrange
    const state = { ...buildState(), selectedGame: null }
    const createBet = jest.fn(async () => ({}))
    const { result } = renderHook(() =>
      useNewBetActions(state as never, {} as never, navigation, createBet),
    )

    // Act
    await act(async () => {
      await result.current.handleSubmit()
    })

    // Assert
    expect(createBet).not.toHaveBeenCalled()
  })

  it('should block submit and show stake validation error for non-positive equal stake', async () => {
    // Arrange
    const state = { ...buildState(), stakeAmount: 0, stakeMode: 'equal' as const }
    const createBet = jest.fn(async () => ({}))
    const alertSpy = jest.spyOn(Alert, 'alert')
    const { result } = renderHook(() =>
      useNewBetActions(state as never, {} as never, navigation, createBet),
    )

    // Act
    await act(async () => {
      await result.current.handleSubmit()
    })

    // Assert
    expect(createBet).not.toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalledWith('Błąd', 'Stawka musi być większa niż 0 PLN')
  })

  it('should reset wizard state to initial defaults', () => {
    // Arrange
    const state = buildState()
    const { result } = renderHook(() =>
      useNewBetActions(state, {} as never, navigation, jest.fn(async () => ({}))),
    )

    // Act
    act(() => {
      result.current.resetNewBet()
    })

    // Assert
    expect(state.setStep).toHaveBeenCalledWith(1)
    expect(state.setSelectedGame).toHaveBeenCalledWith(null)
    expect(state.setStakeMode).toHaveBeenCalledWith('none')
  })
})
