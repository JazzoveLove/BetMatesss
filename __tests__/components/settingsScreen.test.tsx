import React from 'react'
import { Alert } from 'react-native'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import SettingsScreen from '@/features/profile/screens/settings'
import { UsersService } from '@/shared/lib/users.service'

const mockSignOut = jest.fn().mockResolvedValue(undefined)
const mockSetAuthScreen = jest.fn()

jest.mock('@/features/auth', () => ({
  useAuth: () => ({ signOut: mockSignOut }),
  useAuthContext: () => ({ setAuthScreen: mockSetAuthScreen }),
}))

jest.mock('@/shared/lib/users.service', () => ({
  UsersService: { deleteMyAccount: jest.fn() },
}))

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}))

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native')
  return { SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View> }
})

const mockDeleteMyAccount = UsersService.deleteMyAccount as jest.Mock

/** Odpala destrukcyjny przycisk z ostatniego Alert.alert (potwierdzenie usunięcia). */
async function confirmDeleteFromAlert() {
  const alertSpy = Alert.alert as unknown as jest.Mock
  const lastCall = alertSpy.mock.calls[alertSpy.mock.calls.length - 1]
  const buttons = lastCall[2] as { text: string; onPress?: () => void | Promise<void> }[]
  const confirm = buttons.find(b => b.text === 'Usuń konto')
  await act(async () => {
    await confirm?.onPress?.()
  })
}

beforeEach(() => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  mockSignOut.mockClear()
  mockSetAuthScreen.mockClear()
  mockDeleteMyAccount.mockReset()
})

afterEach(() => {
  ;(Alert.alert as unknown as jest.Mock).mockRestore()
})

describe('SettingsScreen — nawigacja po usunięciu konta (BŁĄD-3)', () => {
  it('po udanym usunięciu: authScreen wraca na "welcome", potem signOut', async () => {
    mockDeleteMyAccount.mockResolvedValue({})

    render(<SettingsScreen />)
    fireEvent.press(screen.getByText('Usuń konto'))
    await confirmDeleteFromAlert()

    expect(mockSetAuthScreen).toHaveBeenCalledWith('welcome')
    expect(mockSignOut).toHaveBeenCalledTimes(1)
    // reset ekranu MUSI polecieć przed signOut — to onAuthStateChange(null)
    // z signOut przełącza appState na 'auth' i wtedy czytany jest authScreen.
    expect(mockSetAuthScreen.mock.invocationCallOrder[0]).toBeLessThan(
      mockSignOut.mock.invocationCallOrder[0],
    )
  })

  it('gdy usunięcie zwróci błąd: NIE rusza authScreen ani nie wylogowuje', async () => {
    mockDeleteMyAccount.mockResolvedValue({ error: 'Coś poszło nie tak' })

    render(<SettingsScreen />)
    fireEvent.press(screen.getByText('Usuń konto'))
    await confirmDeleteFromAlert()

    expect(mockSetAuthScreen).not.toHaveBeenCalled()
    expect(mockSignOut).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Błąd', 'Coś poszło nie tak')
  })
})
