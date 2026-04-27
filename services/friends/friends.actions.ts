import { supabase } from '../../lib/supabase'
import type { FriendshipRow } from '../../types/user.types'

export async function acceptFriendship(id: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', id)
  return error ? { error: error.message } : {}
}

export async function rejectFriendship(id: string): Promise<{ error?: string }> {
  const { error } = await supabase.from('friendships').delete().eq('id', id)
  return error ? { error: error.message } : {}
}

export async function ensureFriendshipAccepted(userId: string, otherId: string): Promise<{ error?: string }> {
  if (userId === otherId) return {}

  const { data: existing, error: existingError } = await supabase
    .from('friendships')
    .select('id, status')
    .or(`and(user_a.eq.${userId},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${userId})`)
    .maybeSingle()

  if (existingError) return { error: existingError.message }

  if (existing) {
    if ((existing as FriendshipRow).status === 'accepted') return {}
    const { error: updateError } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', (existing as FriendshipRow).id)
    return updateError ? { error: updateError.message } : {}
  }

  const { error: insertError } = await supabase.from('friendships').insert({
    user_a: userId,
    user_b: otherId,
    status: 'accepted',
  })
  if (insertError) return { error: insertError.message }

  return {}
}
