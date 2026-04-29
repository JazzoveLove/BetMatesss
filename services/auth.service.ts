import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { UserProfile, UserProfileRow } from '../types/user.types'

export const AuthService = {
  signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  },

  signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password })
  },

  signOut() {
    return supabase.auth.signOut()
  },

  getSession() {
    return supabase.auth.getSession()
  },

  async getCurrentUserId(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user.id ?? null
  },

  async getCurrentUserProfile(): Promise<{ id: string; nick: string } | null> {
    const userId = await AuthService.getCurrentUserId()
    if (!userId) return null
    const { data } = await supabase
      .from('users')
      .select('id, nick')
      .eq('id', userId)
      .single()
    return data ? { id: data.id, nick: data.nick } : null
  },

  async hasProfile(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    return Boolean(data)
  },

  async createProfile(userId: string, nick: string): Promise<{ error?: string; code?: string }> {
    const { error } = await supabase.from('users').insert({ id: userId, nick })
    if (error) return { error: error.message, code: error.code }
    return {}
  },

  onAuthStateChange(cb: (_event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(cb)
  },

  mapProfileRow(row: UserProfileRow): UserProfile {
    return {
      id: row.id,
      nick: row.nick,
      avatarUrl: row.avatar_url,
      inviteCode: row.invite_code,
      createdAt: row.created_at,
      phone: row.phone,
    }
  },
}

export const signIn = AuthService.signIn
export const signUp = AuthService.signUp
export const signOut = AuthService.signOut
export const getSession = AuthService.getSession
export const getCurrentUserId = AuthService.getCurrentUserId
export const getCurrentUserProfile = AuthService.getCurrentUserProfile
