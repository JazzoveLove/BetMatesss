export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_taken'
  | 'email_not_confirmed'
  | 'network_error'
  | 'unknown'

export type AuthActionState = {
  loading: boolean
  error: string | null
}