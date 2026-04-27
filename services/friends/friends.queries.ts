import { supabase } from '../../lib/supabase'
import type { FriendshipRow } from '../../types/user.types'

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
