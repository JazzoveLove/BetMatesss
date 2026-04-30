import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthService } from '../services/auth.service'
import type { UserProfile } from '../types/user.types'

type AuthState = {
  session: Session | null
  user: UserProfile | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    error: null,
  })

  const loadUser = useCallback(async (session: Session | null) => {
    if (!session) {
      setState(prev => ({ ...prev, session: null, user: null }))
      return
    }
    try {
      const profile = await AuthService.getCurrentUserProfile()
      setState(prev => ({
        ...prev,
        session,
        user: profile ? { id: profile.id, nick: profile.nick } : null,
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Błąd ładowania profilu',
      }))
    }
  }, [])

  useEffect(() => {
    let mounted = true
    AuthService.getSession()
      .then(async ({ data }) => {
        if (!mounted) return
        await loadUser(data.session)
        if (mounted) setState(prev => ({ ...prev, loading: false }))
      })
      .catch(err => {
        if (mounted) setState(prev => ({ ...prev, loading: false, error: err.message }))
      })

    const { data: { subscription } } = AuthService.onAuthStateChange(async (_event, session) => {
      await loadUser(session)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUser])

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, error: null }))
    const { error } = await AuthService.signIn(email, password)
    if (error) {
      setState(prev => ({ ...prev, error: error.message }))
      throw new Error(error.message)
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, error: null }))
    const { error } = await AuthService.signUp(email, password)
    if (error) {
      setState(prev => ({ ...prev, error: error.message }))
      throw new Error(error.message)
    }
  }, [])

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, error: null }))
    const { error } = await AuthService.signOut()
    if (error) {
      setState(prev => ({ ...prev, error: error.message }))
      throw new Error(error.message)
    }
  }, [])

  const completeProfile = useCallback(async (userId: string, nick: string) => {
    setState(prev => ({ ...prev, error: null }))
    const result = await AuthService.createProfile(userId, nick)
    if (result.error) {
      setState(prev => ({ ...prev, error: result.error ?? 'Profile create failed' }))
      return result
    }
    try {
      const profile = await AuthService.getCurrentUserProfile()
      setState(prev => ({ ...prev, user: profile ? { id: profile.id, nick: profile.nick } : prev.user }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Nie udało się pobrać profilu użytkownika',
      }))
    }
    return result
  }, [])

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    completeProfile,
  }
}
