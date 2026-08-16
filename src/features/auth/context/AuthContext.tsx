import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthService } from '../api/auth.service'

export type AppAuthState = 'loading' | 'auth' | 'setup' | 'main'

export type AuthContextValue = {
  appState: AppAuthState
  session: Session | null
  userId: string | null
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

  useEffect(() => {
    let cancelled = false

    async function checkProfile(sess: Session) {
      if (cancelled) return
      setSession(sess)
      const hasProfile = await AuthService.hasProfile(sess.user.id)
      if (cancelled) return
      setAppState(hasProfile ? 'main' : 'setup')
    }

    void AuthService.getSession().then(({ data: { session: initial } }) => {
      if (cancelled) return
      if (!initial) {
        setAppState('auth')
        return
      }
      void checkProfile(initial)
    })

    const {
      data: { subscription },
    } = AuthService.onAuthStateChange((_event, sess) => {
      if (cancelled) return
      if (!sess) {
        setSession(null)
        setAppState('auth')
        return
      }
      void checkProfile(sess)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ appState, session, userId, completeSetup }}>
      {children}
    </AuthContext.Provider>
  )
}
