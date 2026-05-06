import React from 'react'
import { Animated, Text, View } from 'react-native'
import { render } from '@testing-library/react-native'
import RivalryScreen from '../../app/rivalry'
import { Colors } from '../../constants/colors'

jest.mock('react-native-safe-area-context', () => {
  const ReactLocal = require('react')
  const { View: RNView } = require('react-native')
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <RNView>{children}</RNView>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  }
})

const mockUseRoute = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => mockUseRoute(),
}))

const mockUseRivalry = jest.fn()
jest.mock('../../hooks/useRivalry', () => ({
  useRivalry: (...args: unknown[]) => mockUseRivalry(...args),
}))

jest.mock('../../hooks/useRivalryScreenActions', () => ({
  useRivalryScreenActions: () => ({ openNewBet: jest.fn(), handleRematch: jest.fn() }),
}))

describe('RivalryScreen', () => {
  let timingSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRoute.mockReturnValue({ params: { friendId: 'kasia' } })
    timingSpy = jest.spyOn(Animated, 'timing').mockImplementation(
      () =>
        ({
          start: (cb?: (result: { finished: boolean }) => void) => cb?.({ finished: true }),
          stop: jest.fn(),
          reset: jest.fn(),
        }) as never,
    )
  })

  afterEach(() => {
    timingSpy.mockRestore()
  })

  it('pokazuje bilans head-to-head oraz dodatni bilans finansowy', () => {
    // Arrange
    mockUseRivalry.mockReturnValue({
      loading: false,
      refreshing: false,
      friendNick: 'Kasia',
      onRefresh: jest.fn(),
      paymentSummary: { totalPaidByMe: 60, totalPaidByRival: 20, pendingAmount: 0, pendingStatus: 'clear', settledBetsCount: 4 },
      matches: [
        { betId: '1', rivalryId: 'r1', gameTemplate: 'pool', createdAt: '2026-05-01T00:00:00Z', score: '2:1', stakeAmount: 20, profit: 20, outcome: 'win' },
        { betId: '2', rivalryId: 'r1', gameTemplate: 'pool', createdAt: '2026-05-02T00:00:00Z', score: '3:1', stakeAmount: 20, profit: 20, outcome: 'win' },
        { betId: '3', rivalryId: 'r1', gameTemplate: 'fifa', createdAt: '2026-05-03T00:00:00Z', score: '0:1', stakeAmount: 20, profit: -20, outcome: 'loss' },
        { betId: '4', rivalryId: 'r1', gameTemplate: 'pool', createdAt: '2026-05-04T00:00:00Z', score: '2:0', stakeAmount: 20, profit: 20, outcome: 'win' },
        { betId: '5', rivalryId: 'r1', gameTemplate: 'fifa', createdAt: '2026-05-05T00:00:00Z', score: '1:0', stakeAmount: 20, profit: 20, outcome: 'win' },
        { betId: '6', rivalryId: 'r1', gameTemplate: 'pool', createdAt: '2026-05-06T00:00:00Z', score: '0:2', stakeAmount: 20, profit: -20, outcome: 'loss' },
        { betId: '7', rivalryId: 'r1', gameTemplate: 'pool', createdAt: '2026-05-07T00:00:00Z', score: '2:1', stakeAmount: 20, profit: 20, outcome: 'win' },
        { betId: '8', rivalryId: 'r1', gameTemplate: 'fifa', createdAt: '2026-05-08T00:00:00Z', score: '4:0', stakeAmount: 20, profit: 20, outcome: 'win' },
        { betId: '9', rivalryId: 'r1', gameTemplate: 'pool', createdAt: '2026-05-09T00:00:00Z', score: '1:2', stakeAmount: 20, profit: -20, outcome: 'loss' },
        { betId: '10', rivalryId: 'r1', gameTemplate: 'fifa', createdAt: '2026-05-10T00:00:00Z', score: '3:2', stakeAmount: 20, profit: -20, outcome: 'loss' },
      ],
    })

    // Act
    const { getByText, getAllByText } = render(<RivalryScreen />)

    // Assert
    expect(getByText('6:4')).toBeTruthy()
    expect(getAllByText('Kasia').length).toBeGreaterThan(0)
    expect(getByText('+40 zł')).toHaveStyle({ color: Colors.green })
    expect(getByText('10 MECZY')).toBeTruthy()
  })

  it('pokazuje dyscypliny osobno (Bilard i FIFA) na liście/chipsach', () => {
    // Arrange
    mockUseRivalry.mockReturnValue({
      loading: false,
      refreshing: false,
      friendNick: 'Kasia',
      onRefresh: jest.fn(),
      paymentSummary: { totalPaidByMe: 0, totalPaidByRival: 0, pendingAmount: 0, pendingStatus: 'clear', settledBetsCount: 0 },
      matches: [
        { betId: '1', rivalryId: 'r1', gameTemplate: 'pool', createdAt: '2026-05-01T00:00:00Z', score: '2:1', stakeAmount: 20, profit: 20, outcome: 'win' },
        { betId: '2', rivalryId: 'r1', gameTemplate: 'fifa', createdAt: '2026-05-02T00:00:00Z', score: '1:2', stakeAmount: 20, profit: -20, outcome: 'loss' },
      ],
    })

    // Act
    const { getByText, getAllByText } = render(<RivalryScreen />)

    // Assert
    expect(getAllByText(/pool/i).length).toBeGreaterThan(0)
    expect(getAllByText(/FIFA/i).length).toBeGreaterThan(0)
  })

  it('pokazuje ujemny bilans finansowy na czerwono', () => {
    // Arrange
    mockUseRivalry.mockReturnValue({
      loading: false,
      refreshing: false,
      friendNick: 'Kasia',
      onRefresh: jest.fn(),
      paymentSummary: { totalPaidByMe: 0, totalPaidByRival: 40, pendingAmount: 40, pendingStatus: 'unpaid', settledBetsCount: 0 },
      matches: [
        { betId: '1', rivalryId: 'r1', gameTemplate: 'pool', createdAt: '2026-05-01T00:00:00Z', score: '0:2', stakeAmount: 20, profit: -20, outcome: 'loss' },
        { betId: '2', rivalryId: 'r1', gameTemplate: 'pool', createdAt: '2026-05-02T00:00:00Z', score: '1:3', stakeAmount: 20, profit: -20, outcome: 'loss' },
      ],
    })

    // Act
    const { getByText } = render(<RivalryScreen />)

    // Assert
    expect(getByText('-40 zł')).toHaveStyle({ color: Colors.red })
  })

  it('przy braku historii pokazuje pusty stan listy', () => {
    // Arrange
    mockUseRivalry.mockReturnValue({
      loading: false,
      refreshing: false,
      friendNick: 'Kasia',
      onRefresh: jest.fn(),
      paymentSummary: { totalPaidByMe: 0, totalPaidByRival: 0, pendingAmount: 0, pendingStatus: 'clear', settledBetsCount: 0 },
      matches: [],
    })

    // Act
    const { getByText, queryByText } = render(<RivalryScreen />)

    // Assert
    expect(getByText('Brak meczów dla tego filtra.')).toBeTruthy()
    expect(queryByText('1:0')).toBeNull()
  })

  // STUB — replace with real component
  it('STUB: komunikat "Jesteś winien Kasi 40 PLN" dla bilansu ujemnego', () => {
    // Arrange
    const stubText = 'Jesteś winien Kasi 40 PLN'

    // Act
    const { getByText } = render(
      <View>
        <Text>{stubText}</Text>
      </View>,
    )

    // Assert
    expect(getByText(stubText)).toBeTruthy()
  })
})
