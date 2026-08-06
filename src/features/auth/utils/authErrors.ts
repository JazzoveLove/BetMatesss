import type { AuthErrorCode } from '../types'
import { AUTH_ERROR_MESSAGES_PL } from '../constants'

function getAuthErrorCode(error: unknown): AuthErrorCode {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('Invalid login credentials')) return 'invalid_credentials'
  if (message.includes('User already registered')) return 'email_taken'
  if (message.includes('Email not confirmed')) return 'email_not_confirmed'
  if (message.includes('Network request failed')) return 'network_error'
  return 'unknown'
}

export function mapAuthError(error: unknown): string {
  return AUTH_ERROR_MESSAGES_PL[getAuthErrorCode(error)]
}