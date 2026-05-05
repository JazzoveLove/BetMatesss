import { supabase } from '../../lib/supabase'
import { generateInviteCode } from '../../lib/invite-code'
import type { FriendshipRow } from '../../types/user.types'

type InviteCodeResult = { invite_code: string | null }

export async function ensureMyInviteCode(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('invite_code')
    .eq('id', userId)
    .maybeSingle()
    .returns<InviteCodeResult>()

  if (error) return null

  const existing = data?.invite_code ?? null
  if (existing) return existing

  for (let i = 0; i < 12; i++) {
    const code = generateInviteCode(8)
    const { data: row, error: upErr } = await supabase
      .from('users')
      .update({ invite_code: code })
      .eq('id', userId)
      .is('invite_code', null)
      .select('invite_code')
      .maybeSingle()
      .returns<InviteCodeResult>()

    if (!upErr && row != null && row.invite_code) {
      return row.invite_code
    }

    if (upErr?.code === '23505') continue

    const { data: again, error: againErr } = await supabase
      .from('users')
      .select('invite_code')
      .eq('id', userId)
      .maybeSingle()
      .returns<InviteCodeResult>()
    if (againErr) return null
    const c = again?.invite_code
    if (c) return c
  }

  return null
}

type LookupRow = { user_id: string; user_nick: string }

export async function lookupUserByCode(
  code: string,
): Promise<{ userId: string; nick: string } | { error: string; missingFunction?: boolean }> {
  const { data, error } = await supabase.rpc('lookup_user_by_invite_code', { p_code: code })
  if (error) {
    const missingFunction =
      error.message?.includes('lookup_user_by_invite_code') || error.code === 'PGRST202'
    return { error: error.message, missingFunction }
  }
  const rows = data as LookupRow[] | null
  const first = rows?.[0]
  if (!first) return { error: 'not_found' }
  return { userId: first.user_id, nick: first.user_nick }
}

export type FriendInviteResult =
  | { type: 'self' }
  | { type: 'already_friends' }
  | { type: 'already_sent' }
  | { type: 'accepted' }
  | { type: 'sent' }
  | { type: 'not_found' }
  | { type: 'missing_function' }
  | { type: 'duplicate' }
  | { type: 'error'; message: string }

export async function handleFriendInvite(
  userId: string,
  otherId: string,
): Promise<FriendInviteResult> {
  if (otherId === userId) return { type: 'self' }

  const { data: exists, error: existsErr } = await supabase.rpc(
    'user_exists_for_friend_invite',
    { p_id: otherId },
  )

  if (existsErr) {
    if (existsErr.code === 'PGRST202' || existsErr.message?.includes('user_exists_for_friend_invite')) {
      return { type: 'missing_function' }
    }
    return { type: 'error', message: existsErr.message }
  }

  if (exists !== true) return { type: 'not_found' }

  const { data: anyRow, error: anyRowErr } = await supabase
    .from('friendships')
    .select('id, user_a, user_b, status')
    .or(
      `and(user_a.eq.${userId},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${userId})`,
    )
    .maybeSingle()
    .returns<FriendshipRow>()
  if (anyRowErr) return { type: 'error', message: anyRowErr.message }

  if (anyRow) {
    const r = anyRow
    if (r.status === 'accepted') return { type: 'already_friends' }
    if (r.user_a === otherId && r.user_b === userId) {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', r.id)
      if (error) return { type: 'error', message: error.message }
      return { type: 'accepted' }
    }
    if (r.user_a === userId && r.user_b === otherId) return { type: 'already_sent' }
  }

  const { error: insErr } = await supabase.from('friendships').insert({
    user_a: userId,
    user_b: otherId,
    status: 'pending',
  })

  if (insErr) {
    if (insErr.code === '23505') return { type: 'duplicate' }
    return { type: 'error', message: insErr.message }
  }

  return { type: 'sent' }
}

export async function searchUsersByNick(
  query: string,
  excludeId: string,
): Promise<{ id: string; nick: string }[]> {
  if (query.trim().length < 2) return []
  const { data, error } = await supabase
    .from('users')
    .select('id, nick')
    .ilike('nick', `%${query.trim()}%`)
    .limit(8)
  if (error) {
    return []
  }
  return (data ?? []).filter(u => u.id !== excludeId)
}
