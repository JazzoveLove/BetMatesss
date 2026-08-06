import { mapAuthError } from '@/features/auth/utils/authErrors'
import { AUTH_ERROR_MESSAGES_PL } from '@/features/auth/constants'

describe('mapAuthError', () => {
  it('mapuje błąd "Invalid login credentials" na komunikat o błędnych danych logowania', () => {
    // Arrange
    const error = new Error('Invalid login credentials')

    // Act
    const message = mapAuthError(error)

    // Assert
    expect(message).toBe(AUTH_ERROR_MESSAGES_PL.invalid_credentials)
  })

  it('mapuje błąd "User already registered" na komunikat o zajętym e-mailu', () => {
    // Arrange
    const error = new Error('User already registered')

    // Act
    const message = mapAuthError(error)

    // Assert
    expect(message).toBe(AUTH_ERROR_MESSAGES_PL.email_taken)
  })

  it('mapuje błąd "Email not confirmed" na komunikat o niepotwierdzonym e-mailu', () => {
    // Arrange
    const error = new Error('Email not confirmed')

    // Act
    const message = mapAuthError(error)

    // Assert
    expect(message).toBe(AUTH_ERROR_MESSAGES_PL.email_not_confirmed)
  })

  it('mapuje błąd "Network request failed" na komunikat o braku połączenia', () => {
    // Arrange
    const error = new Error('Network request failed')

    // Act
    const message = mapAuthError(error)

    // Assert
    expect(message).toBe(AUTH_ERROR_MESSAGES_PL.network_error)
  })

  it('mapuje nieznany błąd na komunikat ogólny', () => {
    // Arrange
    const error = new Error('Coś zupełnie innego')

    // Act
    const message = mapAuthError(error)

    // Assert
    expect(message).toBe(AUTH_ERROR_MESSAGES_PL.unknown)
  })
})
