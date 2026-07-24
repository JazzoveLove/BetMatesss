import { useCallback, useState } from 'react'
import { AuthService } from '../services/auth.service'
import { credentialsSchema } from '../utils/auth/authValidation'
import { getFirstValidationError } from '../utils/validation'
import { mapAuthError } from '../utils/auth/authErrors'
import type { AuthActionState } from '../types/auth.types'

export function useAuth() {
  const [state, setState] = useState<AuthActionState>({ loading: false, error: null })

  const signIn = useCallback(async (email: string, password: string) => {
    const validationError = getFirstValidationError(credentialsSchema.safeParse({ email, password }))
    if (validationError) {
      setState({ loading: false, error: validationError })
      throw new Error(validationError)
    }
    setState({ loading: true, error: null })
    const { error } = await AuthService.signIn(email, password)
    if (error) {
      const message = mapAuthError(error)
      setState({ loading: false, error: message })
      throw new Error(message)
    }
    setState({ loading: false, error: null })
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const validationError = getFirstValidationError(credentialsSchema.safeParse({ email, password }))
    if (validationError) {
      setState({ loading: false, error: validationError })
      throw new Error(validationError)
    }
    setState({ loading: true, error: null })
    const { error } = await AuthService.signUp(email, password)
    if (error) {
      const message = mapAuthError(error)
      setState({ loading: false, error: message })
      throw new Error(message)
    }
    setState({ loading: false, error: null })
  }, [])

  const signOut = useCallback(async () => {
    setState({ loading: true, error: null })
    const { error } = await AuthService.signOut()
    if (error) {
      const message = mapAuthError(error)
      setState({ loading: false, error: message })
      throw new Error(message)
    }
    setState({ loading: false, error: null })
  }, [])

  const completeProfile = useCallback(async (userId: string, nick: string) => {
    setState({ loading: true, error: null })
    const result = await AuthService.createProfile(userId, nick)
    setState({ loading: false, error: result.error ?? null })
    return result
  }, [])

  return { ...state, signIn, signUp, signOut, completeProfile }
}