import { mapAuthError } from '@/features/auth/utils/authErrors'
import { AUTH_ERROR_MESSAGES_PL } from '@/features/auth/constants'

describe('mapAuthError', () => {
  it('mapuje błąd "Invalid login credentials" na komunikat o błędnych danych logowania', () => {
    const error = new Error('Invalid login credentials')

    const message = mapAuthError(error)

    expect(message).toBe(AUTH_ERROR_MESSAGES_PL.invalid_credentials)
  })

  it('mapuje błąd "User already registered" na komunikat o zajętym e-mailu', () => {
    const error = new Error('User already registered')

    const message = mapAuthError(error)

    expect(message).toBe(AUTH_ERROR_MESSAGES_PL.email_taken)
  })

  it('mapuje błąd "Email not confirmed" na komunikat o niepotwierdzonym e-mailu', () => {
    const error = new Error('Email not confirmed')

    const message = mapAuthError(error)

    expect(message).toBe(AUTH_ERROR_MESSAGES_PL.email_not_confirmed)
  })

  it('mapuje błąd "Network request failed" na komunikat o braku połączenia', () => {
    const error = new Error('Network request failed')

    const message = mapAuthError(error)

    expect(message).toBe(AUTH_ERROR_MESSAGES_PL.network_error)
  })

  it('mapuje nieznany błąd na komunikat ogólny', () => {
    const error = new Error('Coś zupełnie innego')

    const message = mapAuthError(error)

    expect(message).toBe(AUTH_ERROR_MESSAGES_PL.unknown)
  })
})
