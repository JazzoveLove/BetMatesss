import { supabase } from '../lib/supabase'
import { generateInviteCode } from '../lib/invite-code'
import type { FriendshipRow } from '../types/user.types'

// ─── Friendships ──────────────────────────────────────────────────────────────

export type FriendshipsData = {
  incoming: FriendshipRow[]
  outgoing: FriendshipRow[]
  friends: FriendshipRow[]
  nickById: Record<string, string>
  avatarById: Record<string, string | null>
}

type UserProfileMini = {
  id: string
  nick: string
  avatar_url: string | null
}

export async function loadFriendships(userId: string): Promise<FriendshipsData> {
  const { data, error } = await supabase
    .from('friendships')
    .select('id, user_a, user_b, status')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)

  if (error) return { incoming: [], outgoing: [], friends: [], nickById: {}, avatarById: {} }

  const rows = (data ?? []) as FriendshipRow[]
  const incoming = rows.filter(r => r.status === 'pending' && r.user_b === userId)
  const outgoing = rows.filter(r => r.status === 'pending' && r.user_a === userId)
  const friends = rows.filter(r => r.status === 'accepted')

  const need = new Set<string>()
  for (const r of [...incoming, ...outgoing, ...friends]) {
    if (r.user_a === userId) need.add(r.user_b)
    else if (r.user_b === userId) need.add(r.user_a)
  }

  const profiles = await loadProfilesByIds([...need])
  const nickById = Object.fromEntries(profiles.map(p => [p.id, p.nick]))
  const avatarById = Object.fromEntries(profiles.map(p => [p.id, p.avatar_url]))
  return { incoming, outgoing, friends, nickById, avatarById }
}

export async function loadNicksByIds(ids: string[]): Promise<Record<string, string>> {
  const uniq = [...new Set(ids)].filter(Boolean)
  if (uniq.length === 0) return {}
  const { data, error } = await supabase.from('users').select('id, nick').in('id', uniq)
  if (error || !data) return {}
  return Object.fromEntries(data.map(u => [u.id, u.nick]))
}

async function loadProfilesByIds(ids: string[]): Promise<UserProfileMini[]> {
  const uniq = [...new Set(ids)].filter(Boolean)
  if (uniq.length === 0) return []
  const { data, error } = await supabase
    .from('users')
    .select('id, nick, avatar_url')
    .in('id', uniq)
  if (error || !data) return []
  return data as UserProfileMini[]
}

export async function getAcceptedFriendsList(
  userId: string,
): Promise<{ id: string; nick: string; avatar_url?: string | null }[]> {
  type FriendProfile = { id: string; nick: string; avatar_url: string | null }
  const { data: rows, error } = await supabase
    .from('friendships')
    .select('id, user_a, user_b, status')
    .eq('status', 'accepted')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)

  if (error) return []

  const friendRows = (rows ?? []) as FriendshipRow[]
  const otherIds = friendRows
    .map(r => (r.user_a === userId ? r.user_b : r.user_b === userId ? r.user_a : null))
    .filter((id): id is string => !!id)
  const uniqIds = [...new Set(otherIds)]
  if (uniqIds.length === 0) return []

  const { data: profiles, error: profilesError } = await supabase
    .from('users')
    .select('id, nick, avatar_url')
    .in('id', uniqIds)

  if (profilesError || !profiles) return []

  const byId = new Map(
    profiles.map(p => [p.id, { nick: p.nick, avatar_url: p.avatar_url as string | null | undefined }]),
  )

  const out: FriendProfile[] = uniqIds
    .map(id => {
      const profile = byId.get(id)
      if (!profile) return null
      return { id, nick: profile.nick, avatar_url: profile.avatar_url ?? null }
    })
    .filter((row): row is FriendProfile => !!row)

  out.sort((a, b) => a.nick.localeCompare(b.nick, 'pl'))
  return out
}

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

// ─── Invite code ──────────────────────────────────────────────────────────────

export async function ensureMyInviteCode(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('invite_code')
    .eq('id', userId)
    .maybeSingle()

  if (error) return null

  const existing = (data as { invite_code?: string | null } | null)?.invite_code
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

    if (!upErr && row && (row as { invite_code?: string }).invite_code) {
      return (row as { invite_code: string }).invite_code
    }

    if (upErr?.code === '23505') continue

    const { data: again } = await supabase
      .from('users')
      .select('invite_code')
      .eq('id', userId)
      .maybeSingle()
    const c = (again as { invite_code?: string } | null)?.invite_code
    if (c) return c
  }

  return null
}

export async function lookupUserByCode(
  code: string,
): Promise<{ userId: string; nick: string } | { error: string; missingFunction?: boolean }> {
  const { data, error } = await supabase.rpc('lookup_user_by_invite_code', { p_code: code })
  if (error) {
    const missingFunction =
      error.message?.includes('lookup_user_by_invite_code') || error.code === 'PGRST202'
    return { error: error.message, missingFunction }
  }
  const rows = data as { user_id: string; user_nick: string }[] | null
  const first = rows?.[0]
  if (!first) return { error: 'not_found' }
  return { userId: first.user_id, nick: first.user_nick }
}

// ─── Invite by user ID ────────────────────────────────────────────────────────

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

  const { data: anyRow } = await supabase
    .from('friendships')
    .select('id, user_a, user_b, status')
    .or(
      `and(user_a.eq.${userId},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${userId})`,
    )
    .maybeSingle()

  if (anyRow) {
    const r = anyRow as FriendshipRow
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

// ─── Search by nick ───────────────────────────────────────────────────────────

export async function searchUsersByNick(
  query: string,
  excludeId: string,
): Promise<{ id: string; nick: string }[]> {
  if (query.trim().length < 2) return []
  const { data } = await supabase
    .from('users')
    .select('id, nick')
    .ilike('nick', `%${query.trim()}%`)
    .limit(8)
  return (data ?? []).filter(u => u.id !== excludeId)
}

// ─── Realtime subscription ───────────────────────────────────────────────────

export function subscribeFriendshipChanges(
  userId: string,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel(`friendships-live-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'friendships' },
      payload => {
        const newer = payload.new as Partial<FriendshipRow> | null
        const older = payload.old as Partial<FriendshipRow> | null
        const touchesMe =
          newer?.user_a === userId ||
          newer?.user_b === userId ||
          older?.user_a === userId ||
          older?.user_b === userId
        if (touchesMe) onChange()
      },
    )
    .subscribe()

  return () => { void supabase.removeChannel(channel) }
}
