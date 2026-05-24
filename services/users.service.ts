import { supabase } from '../lib/supabase'
import { mapUserProfileRow } from '../utils/mappers'
import type { UserProfile, UserProfileRow } from '../types/user.types'

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
}
