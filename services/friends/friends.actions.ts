import { supabase } from '../../lib/supabase'

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

type ExistingFriendship = { id: string; status: string }

export async function ensureFriendshipAccepted(userId: string, otherId: string): Promise<{ error?: string }> {
  if (userId === otherId) return {}

  const { data: existing, error: existingError } = await supabase
    .from('friendships')
    .select('id, status')
    .or(`and(user_a.eq.${userId},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${userId})`)
    .maybeSingle()
    .returns<ExistingFriendship>()

  if (existingError) return { error: existingError.message }

  if (existing) {
    if (existing.status === 'accepted') return {}
    const { error: updateError } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', existing.id)
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
