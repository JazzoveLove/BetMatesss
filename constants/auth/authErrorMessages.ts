import type { AuthErrorCode } from '../../types/auth.types'

export const AUTH_ERROR_MESSAGES_PL: Record<AuthErrorCode, string> = {
  invalid_credentials: 'Błędny e-mail lub hasło.',
  email_taken: 'Ten e-mail jest już zarejestrowany.',
  email_not_confirmed: 'Potwierdź adres e-mail przed zalogowaniem — sprawdź skrzynkę.',
  network_error: 'Brak połączenia z internetem.',
  unknown: 'Coś poszło nie tak. Spróbuj ponownie.',
}