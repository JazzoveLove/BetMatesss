import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthService } from '../services/auth.service'

export type AppAuthState = 'loading' | 'auth' | 'setup' | 'main'

export type AuthContextValue = {
  appState: AppAuthState
  session: Session | null
  userId: string | null
  /** Call after profile creation on the setup screen. */
  completeSetup: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppAuthState>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const userId = session?.user.id ?? null

  const completeSetup = useCallback(() => {
    setAppState('main')
  }, [])

  async function checkProfile(sess: Session) {
    setSession(sess)
    const hasProfile = await AuthService.hasProfile(sess.user.id)
    setAppState(hasProfile ? 'main' : 'setup')
  }

  useEffect(() => {
    void AuthService.getSession().then(({ data: { session: initial } }) => {
      if (!initial) {
        setAppState('auth')
        return
      }
      void checkProfile(initial)
    })

    const {
      data: { subscription },
    } = AuthService.onAuthStateChange((_event, sess) => {
      if (!sess) {
        setSession(null)
        setAppState('auth')
        return
      }
      void checkProfile(sess)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ appState, session, userId, completeSetup }}>
      {children}
    </AuthContext.Provider>
  )
}
