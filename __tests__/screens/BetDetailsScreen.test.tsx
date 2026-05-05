import React from 'react'
import { render } from '@testing-library/react-native'
import BetDetailScreen from '../../app/bet-detail'

jest.mock('react-native-safe-area-context', () => {
  const ReactLocal = require('react')
  const { View } = require('react-native')
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  }
})

const mockUseRoute = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => mockUseRoute(),
}))

const mockUseBetDetail = jest.fn()
jest.mock('../../hooks/useBetDetail', () => ({
  useBetDetail: (...args: unknown[]) => mockUseBetDetail(...args),
}))

function baseHookData() {
  return {
    loading: false,
    currentUserId: 'marek',
    pendingResult: null,
    resolving: false,
    confirming: false,
    disputing: false,
    accepting: false,
    rejecting: false,
    markingPaid: null,
    reminding: null,
    submitResult: jest.fn(),
    confirmResult: jest.fn(),
    disputeResult: jest.fn(),
    acceptBet: jest.fn(),
    rejectBet: jest.fn(),
    markPaid: jest.fn(),
    sendReminder: jest.fn(),
    bet: {
      id: 'bet-1',
      creatorId: 'marek',
      gameTemplate: 'pool',
      format: 'elimination',
      stakeMode: 'equal',
      status: 'completed',
      notes: null,
      createdAt: '2026-05-01T12:00:00.000Z',
      participants: [
        { id: 'marek', nick: 'Marek', stakeAmount: 20, odds: 2, role: 'creator', confirmed: true },
        { id: 'kasia', nick: 'Kasia', stakeAmount: 20, odds: 2, role: 'participant', confirmed: true },
      ],
      results: [],
    },
    settlements: [
      {
        id: 's1',
        debtorId: 'tomek',
        debtorNick: 'Tomek',
        creditorId: 'marek',
        creditorNick: 'Marek',
        amount: 20,
        paid: false,
      },
      {
        id: 's2',
        debtorId: 'marek',
        debtorNick: 'Marek',
        creditorId: 'kasia',
        creditorNick: 'Kasia',
        amount: 20,
        paid: false,
      },
    ],
  }
}

describe('BetDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRoute.mockReturnValue({ params: { betId: 'bet-1' } })
  })

  it('wyświetla rozliczony zakład bilardowy i ukrywa potwierdzanie wyniku', () => {
    // Arrange
    mockUseBetDetail.mockReturnValue({
      ...baseHookData(),
      pendingResult: { id: 'r1', winnerId: 'kasia', score: '1:2', recordedBy: 'kasia', confirmed: true },
    })

    // Act
    const { getByText, getAllByText, queryByText } = render(<BetDetailScreen />)

    // Assert
    expect(getByText('Szczegóły zakładu')).toBeTruthy()
    expect(getByText('Zakończony')).toBeTruthy()
    expect(getAllByText('Kasia').length).toBeGreaterThan(0)
    expect(getByText('Tomek jest winien Marek')).toBeTruthy()
    expect(getByText('Marek jest winien Kasia')).toBeTruthy()
    expect(queryByText('Potwierdź wynik ✓')).toBeNull()
  })

  it('dla statusu awaiting_confirmation pokazuje potwierdzenie i spór', () => {
    // Arrange
    mockUseBetDetail.mockReturnValue({
      ...baseHookData(),
      bet: { ...baseHookData().bet, status: 'awaiting_confirmation' },
      settlements: [],
      currentUserId: 'kasia',
      pendingResult: { id: 'r1', winnerId: 'marek', score: '2:1', recordedBy: 'marek', confirmed: false },
    })

    // Act
    const { getByText } = render(<BetDetailScreen />)

    // Assert
    expect(getByText('Czeka na potwierdzenie')).toBeTruthy()
    expect(getByText('Potwierdź wynik ✓')).toBeTruthy()
    expect(getByText('Zgłoś spór')).toBeTruthy()
  })

  it('dla statusu disputed pokazuje spór i nie pokazuje listy rozliczeń', () => {
    // Arrange
    mockUseBetDetail.mockReturnValue({
      ...baseHookData(),
      bet: { ...baseHookData().bet, status: 'disputed' },
      settlements: [],
    })

    // Act
    const { getByText, queryByText } = render(<BetDetailScreen />)

    // Assert
    expect(getByText('Spór')).toBeTruthy()
    expect(queryByText('ROZLICZENIE')).toBeNull()
    expect(queryByText('Tomek jest winien Marek')).toBeNull()
  })
})
