jest.mock('@/features/auth/api/auth.service', () => ({
  AuthService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    createProfile: jest.fn(),
  },
}))

import { act, renderHook } from '@testing-library/react-native'
import { AuthService } from '@/features/auth/api/auth.service'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { credentialsSchema } from '@/features/auth/utils/authValidation'
import { getFirstValidationError } from '@/shared/utils/validation'
import { AUTH_ERROR_MESSAGES_PL } from '@/features/auth/constants'

const mockSignIn = AuthService.signIn as jest.Mock
const mockSignUp = AuthService.signUp as jest.Mock
const mockSignOut = AuthService.signOut as jest.Mock
const mockCreateProfile = AuthService.createProfile as jest.Mock

beforeEach(() => {
  mockSignIn.mockReset()
  mockSignUp.mockReset()
  mockSignOut.mockReset()
  mockCreateProfile.mockReset()
})

describe('useAuth / signIn', () => {
  it('sukces: loading=true w trakcie, potem loading=false i error=null, AuthService.signIn wywołane z poprawnymi danymi', async () => {
    // Arrange
    mockSignIn.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useAuth())

    // Act
    let signInPromise!: Promise<void>
    act(() => {
      signInPromise = result.current.signIn('test@example.com', 'haslo123')
    })

    // Assert: loading true w trakcie wywołania
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()

    await act(async () => {
      await signInPromise
    })

    // Assert: po zakończeniu
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'haslo123')
  })

  it('błąd walidacji: nie wywołuje AuthService.signIn, ustawia error i rzuca', async () => {
    // Arrange
    const expectedError = getFirstValidationError(credentialsSchema.safeParse({ email: '', password: '' }))
    const { result } = renderHook(() => useAuth())

    // Act & Assert
    await act(async () => {
      await expect(result.current.signIn('', '')).rejects.toThrow(expectedError as string)
    })
    expect(mockSignIn).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(expectedError)
  })

  it('błąd z Supabase: mapowany przez mapAuthError, ustawia error i rzuca', async () => {
    // Arrange
    mockSignIn.mockResolvedValue({ error: new Error('Invalid login credentials') })
    const { result } = renderHook(() => useAuth())

    // Act & Assert
    await act(async () => {
      await expect(result.current.signIn('test@example.com', 'haslo123')).rejects.toThrow(
        AUTH_ERROR_MESSAGES_PL.invalid_credentials,
      )
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(AUTH_ERROR_MESSAGES_PL.invalid_credentials)
  })
})

describe('useAuth / signUp', () => {
  it('sukces: loading=true w trakcie, potem loading=false i error=null, AuthService.signUp wywołane z poprawnymi danymi', async () => {
    // Arrange
    mockSignUp.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useAuth())

    // Act
    let signUpPromise!: Promise<void>
    act(() => {
      signUpPromise = result.current.signUp('nowy@example.com', 'haslo123')
    })

    // Assert: loading true w trakcie wywołania
    expect(result.current.loading).toBe(true)

    await act(async () => {
      await signUpPromise
    })

    // Assert: po zakończeniu
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockSignUp).toHaveBeenCalledWith('nowy@example.com', 'haslo123')
  })

  it('błąd walidacji: nie wywołuje AuthService.signUp, ustawia error i rzuca', async () => {
    // Arrange
    const expectedError = getFirstValidationError(credentialsSchema.safeParse({ email: 'zly-email', password: '123' }))
    const { result } = renderHook(() => useAuth())

    // Act & Assert
    await act(async () => {
      await expect(result.current.signUp('zly-email', '123')).rejects.toThrow(expectedError as string)
    })
    expect(mockSignUp).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(expectedError)
  })

  it('błąd z Supabase: mapowany przez mapAuthError, ustawia error i rzuca', async () => {
    // Arrange
    mockSignUp.mockResolvedValue({ error: new Error('User already registered') })
    const { result } = renderHook(() => useAuth())

    // Act & Assert
    await act(async () => {
      await expect(result.current.signUp('test@example.com', 'haslo123')).rejects.toThrow(
        AUTH_ERROR_MESSAGES_PL.email_taken,
      )
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(AUTH_ERROR_MESSAGES_PL.email_taken)
  })
})

describe('useAuth / signOut', () => {
  it('sukces: loading=true w trakcie, potem loading=false i error=null', async () => {
    // Arrange
    mockSignOut.mockResolvedValue({ error: null })
    const { result } = renderHook(() => useAuth())

    // Act
    let signOutPromise!: Promise<void>
    act(() => {
      signOutPromise = result.current.signOut()
    })

    // Assert: loading true w trakcie wywołania
    expect(result.current.loading).toBe(true)

    await act(async () => {
      await signOutPromise
    })

    // Assert: po zakończeniu
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('błąd z Supabase: mapowany przez mapAuthError, ustawia error i rzuca', async () => {
    // Arrange
    mockSignOut.mockResolvedValue({ error: new Error('Network request failed') })
    const { result } = renderHook(() => useAuth())

    // Act & Assert
    await act(async () => {
      await expect(result.current.signOut()).rejects.toThrow(AUTH_ERROR_MESSAGES_PL.network_error)
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(AUTH_ERROR_MESSAGES_PL.network_error)
  })
})

describe('useAuth / completeProfile', () => {
  it('sukces: loading=true w trakcie, potem loading=false, error=null, zwraca wynik z AuthService.createProfile', async () => {
    // Arrange
    mockCreateProfile.mockResolvedValue({})
    const { result } = renderHook(() => useAuth())

    // Act
    let completePromise!: Promise<{ error?: string; code?: string }>
    act(() => {
      completePromise = result.current.completeProfile('user-1', 'Maciek')
    })

    // Assert: loading true w trakcie wywołania
    expect(result.current.loading).toBe(true)

    let outcome: { error?: string; code?: string }
    await act(async () => {
      outcome = await completePromise
    })

    // Assert: po zakończeniu
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(outcome!).toEqual({})
    expect(mockCreateProfile).toHaveBeenCalledWith('user-1', 'Maciek')
  })

  it('błąd: AuthService.createProfile zwraca { error, code }, hook ustawia error i zwraca ten sam wynik', async () => {
    // Arrange
    mockCreateProfile.mockResolvedValue({ error: 'Nick zajęty', code: '23505' })
    const { result } = renderHook(() => useAuth())

    // Act
    let outcome: { error?: string; code?: string }
    await act(async () => {
      outcome = await result.current.completeProfile('user-1', 'Maciek')
    })

    // Assert
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Nick zajęty')
    expect(outcome!).toEqual({ error: 'Nick zajęty', code: '23505' })
  })
})
