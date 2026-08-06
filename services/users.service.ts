import { supabase } from '@/shared/lib/supabase'
import { mapUserProfileRow } from '@/shared/utils/mappers'
import type { UserProfile, UserProfileRow } from '@/shared/types/user.types'

export const UsersService = {
  async getFullProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, nick, avatar_url, invite_code, created_at, phone')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapUserProfileRow(data as UserProfileRow)
  },

  async updateNick(userId: string, nick: string): Promise<{ error?: string; code?: string }> {
    const { error } = await supabase.from('users').update({ nick }).eq('id', userId)
    if (error) return { error: error.message, code: error.code }
    return {}
  },
}
