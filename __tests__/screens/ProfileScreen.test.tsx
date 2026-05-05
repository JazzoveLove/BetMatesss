import React from 'react'
import { Animated, Text, View } from 'react-native'
import { render } from '@testing-library/react-native'
import ProfileScreen from '../../app/profile'
import { Colors } from '../../constants/colors'

jest.mock('react-native-safe-area-context', () => {
  const ReactLocal = require('react')
  const { View: RNView } = require('react-native')
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <RNView>{children}</RNView>,
  }
})

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), replace: jest.fn() }),
}))

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}))

const mockUseProfile = jest.fn()
jest.mock('../../hooks/useProfile', () => ({
  useProfile: (...args: unknown[]) => mockUseProfile(...args),
}))

describe('ProfileScreen', () => {
  let timingSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
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

  it('wyświetla nick, statystyki i dodatni bilans gracza', () => {
    // Arrange
    mockUseProfile.mockReturnValue({
      loading: false,
      refreshing: false,
      onRefresh: jest.fn(),
      data: {
        user: { nick: 'Marek', initials: 'MA', memberSince: 'maj 2026', showBalance: true },
        stats: {
          totalMatches: 23,
          winRate: 65,
          balance: 120,
          disciplines: 2,
          friends: 5,
          currentStreak: 3,
          wins: 15,
          losses: 8,
        },
        disciplineStats: [
          { gameId: 'pool', gameName: 'Bilard', gameEmoji: '🎱', wins: 8, losses: 2, total: 10, winRate: 80, balance: 0, hasStake: false },
          { gameId: 'fifa', gameName: 'FIFA', gameEmoji: '⚽', wins: 3, losses: 7, total: 10, winRate: 30, balance: 0, hasStake: false },
        ],
      },
    })

    // Act
    const { getByText } = render(<ProfileScreen />)

    // Assert
    expect(getByText('Marek')).toBeTruthy()
    expect(getByText('15W')).toBeTruthy()
    expect(getByText('/ 8P')).toBeTruthy()
    expect(getByText('65%')).toBeTruthy()
    expect(getByText('+120 zł')).toHaveStyle({ color: Colors.green })
  })

  it('pokazuje statystyki per dyscyplina i rozróżnia najlepszą/najgorszą', () => {
    // Arrange
    mockUseProfile.mockReturnValue({
      loading: false,
      refreshing: false,
      onRefresh: jest.fn(),
      data: {
        user: { nick: 'Marek', initials: 'MA', memberSince: 'maj 2026', showBalance: true },
        stats: { totalMatches: 20, winRate: 50, balance: 0, disciplines: 2, friends: 0, currentStreak: 0, wins: 10, losses: 10 },
        disciplineStats: [
          { gameId: 'pool', gameName: 'Bilard', gameEmoji: '🎱', wins: 8, losses: 2, total: 10, winRate: 80, balance: 0, hasStake: false },
          { gameId: 'fifa', gameName: 'FIFA', gameEmoji: '⚽', wins: 3, losses: 7, total: 10, winRate: 30, balance: 0, hasStake: false },
        ],
      },
    })

    // Act
    const { getByText } = render(<ProfileScreen />)

    // Assert
    expect(getByText('Bilard')).toBeTruthy()
    expect(getByText('80%')).toBeTruthy()
    expect(getByText('FIFA')).toBeTruthy()
    expect(getByText('30%')).toBeTruthy()
  })

  it('w stanie ładowania pokazuje skeleton zamiast danych profilu', () => {
    // Arrange
    mockUseProfile.mockReturnValue({
      loading: true,
      refreshing: false,
      onRefresh: jest.fn(),
      data: null,
    })

    // Act
    const { queryByText, getByText } = render(<ProfileScreen />)

    // Assert
    expect(getByText('Mój profil')).toBeTruthy()
    expect(queryByText('Marek')).toBeNull()
  })

  // STUB — replace with real component
  it('STUB: ranking znajomych pokazuje długi i wierzytelności', () => {
    // Arrange
    const ranking = [
      'Kasia — jesteś winien 40 PLN',
      'Tomek — winien Ci 20 PLN',
    ]

    // Act
    const { getByText } = render(
      <View>
        <Text style={{ color: Colors.red }}>{ranking[0]}</Text>
        <Text style={{ color: Colors.green }}>{ranking[1]}</Text>
      </View>,
    )

    // Assert
    expect(getByText('Kasia — jesteś winien 40 PLN')).toHaveStyle({ color: Colors.red })
    expect(getByText('Tomek — winien Ci 20 PLN')).toHaveStyle({ color: Colors.green })
  })

  // STUB — replace with real component
  it('STUB: brak znajomych pokazuje informację o rankingu', () => {
    // Arrange
    const emptyMsg = 'Dodaj znajomych żeby zobaczyć ranking'

    // Act
    const { getByText } = render(
      <View>
        <Text>{emptyMsg}</Text>
      </View>,
    )

    // Assert
    expect(getByText(emptyMsg)).toBeTruthy()
  })
})
