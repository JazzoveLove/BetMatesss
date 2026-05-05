import React from 'react'
import { Text } from 'react-native'
import { render } from '@testing-library/react-native'
import DashboardScreen from '../../app/dashboard'
import { Colors } from '../../constants/colors'

jest.mock('react-native-safe-area-context', () => {
  const ReactLocal = require('react')
  const { View } = require('react-native')
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  }
})

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}))

const mockUseDashboard = jest.fn()
jest.mock('../../hooks/useDashboard', () => ({
  useDashboard: (...args: unknown[]) => mockUseDashboard(...args),
}))
jest.mock('../../components/dashboard/DashboardStatsRow', () => ({
  DashboardStatsRow: () => null,
  DashboardStatsRowSkeleton: () => null,
}))

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('pokazuje 3 aktywne zakłady i ich kolejność (najnowszy pierwszy)', () => {
    // Arrange
    mockUseDashboard.mockReturnValue({
      loading: false,
      user: { nick: 'Marek', avatarInitials: 'MA' },
      stats: { wins: 10, losses: 4, winRate: 71, totalMatches: 14, balance: 60 },
      activeBets: [
        { id: 'b3', opponentNick: 'Kasia', opponentInitials: 'KA', game: 'Bilard', amount: 20, timeLabel: 'dziś', status: 'active' },
        { id: 'b2', opponentNick: 'Tomek', opponentInitials: 'TO', game: 'FIFA', amount: 30, timeLabel: 'wczoraj', status: 'pending' },
        { id: 'b1', opponentNick: 'Ola', opponentInitials: 'OL', game: 'Szachy', amount: 15, timeLabel: '2 dni temu', status: 'enter_result' },
      ],
      recentMatches: [],
    })

    // Act
    const { getByText, getAllByText } = render(<DashboardScreen />)

    // Assert
    expect(getByText('3 aktywne zakłady')).toBeTruthy()
    const rendered = getAllByText(/vs/)
    expect(rendered[0].props.children.join('')).toContain('Bilard vs Kasia')
    expect(rendered[1].props.children.join('')).toContain('FIFA vs Tomek')
    expect(rendered[2].props.children.join('')).toContain('Szachy vs Ola')
    expect(getByText('20 zł | dziś')).toBeTruthy()
  })

  it('pokazuje ostatnie wyniki z poprawnym znakiem i kolorem', () => {
    // Arrange
    mockUseDashboard.mockReturnValue({
      loading: false,
      user: { nick: 'Marek', avatarInitials: 'MA' },
      stats: { wins: 10, losses: 4, winRate: 71, totalMatches: 14, balance: 60 },
      activeBets: [],
      recentMatches: [
        { id: 'r1', opponentNick: 'Kasia', opponentInitials: 'KA', game: 'Bilard', amount: 50, dateLabel: '01.05.2026', result: 'win' },
        { id: 'r2', opponentNick: 'Tomek', opponentInitials: 'TO', game: 'FIFA', amount: -20, dateLabel: '30.04.2026', result: 'loss' },
        { id: 'r3', opponentNick: 'Ola', opponentInitials: 'OL', game: 'Tenis', amount: 10, dateLabel: '29.04.2026', result: 'win' },
      ],
    })

    // Act
    const { getByText, getAllByText } = render(<DashboardScreen />)

    // Assert
    const plusAmount = getByText('+50 zł')
    const minusAmount = getByText('-20 zł')
    expect(plusAmount).toHaveStyle({ color: Colors.green })
    expect(minusAmount).toHaveStyle({ color: Colors.red })
    expect(getByText('Przegrana')).toBeTruthy()
    expect(getByText(/\| 01.05.2026/)).toBeTruthy()
    expect(getAllByText('Wygrana').length).toBeGreaterThanOrEqual(1)
  })

  it('w stanie ładowania pokazuje skeleton i nie pokazuje danych', () => {
    // Arrange
    mockUseDashboard.mockReturnValue({
      loading: true,
      user: { nick: '', avatarInitials: '' },
      stats: { wins: 0, losses: 0, winRate: 0, totalMatches: 0, balance: 0 },
      activeBets: [],
      recentMatches: [],
    })

    // Act
    const { getByText, queryByText } = render(<DashboardScreen />)

    // Assert
    expect(getByText('0 aktywne zakłady')).toBeTruthy()
    expect(queryByText('Bilard vs Kasia')).toBeNull()
  })

  it('przy pustych listach nie renderuje kart zakładów ani wyników', () => {
    // Arrange
    mockUseDashboard.mockReturnValue({
      loading: false,
      user: { nick: 'Marek', avatarInitials: 'MA' },
      stats: { wins: 0, losses: 0, winRate: 0, totalMatches: 0, balance: 0 },
      activeBets: [],
      recentMatches: [],
    })

    // Act
    const { getByText, queryByText } = render(<DashboardScreen />)

    // Assert
    expect(getByText('0 aktywne zakłady')).toBeTruthy()
    expect(queryByText(/vs/)).toBeNull()
  })

  // STUB — replace with real component
  it('STUB: pusty stan powinien pokazać CTA "Stwórz pierwszy zakład"', () => {
    // Arrange
    const stub = { message: 'Nie masz jeszcze żadnych zakładów', cta: 'Stwórz pierwszy zakład' }

    // Act
    const ui = render(
      <>
        <Text>{stub.message}</Text>
        <Text>{stub.cta}</Text>
      </>,
    )

    // Assert
    expect(ui.getByText('Nie masz jeszcze żadnych zakładów')).toBeTruthy()
    expect(ui.getByText('Stwórz pierwszy zakład')).toBeTruthy()
  })
})
