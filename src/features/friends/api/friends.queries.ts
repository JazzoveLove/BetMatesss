import { supabase } from '@/shared/lib/supabase'
import { DELETED_USER_NICK } from '@/shared/constants/user/deletedUser'
import type { Friendship, FriendshipRow } from '@/shared/types/user.types'

export type FriendshipsData = {
  incoming: Friendship[]
  outgoing: Friendship[]
  friends: Friendship[]
  nickById: Record<string, string>
  avatarById: Record<string, string | null>
}

function mapFriendshipRowToFriendship(row: FriendshipRow): Friendship {
  return {
    id: row.id,
    userAId: row.user_a,
    userBId: row.user_b,
    status: row.status,
  }
}

type UserProfileMini = {
  id: string
  nick: string
  avatar_url: string | null
}

type UserProfileMiniRow = UserProfileMini & { deleted_at: string | null }

async function loadProfilesByIds(ids: string[]): Promise<UserProfileMini[]> {
  const uniq = [...new Set(ids)].filter(Boolean)
  if (uniq.length === 0) return []
  const { data, error } = await supabase
    .from('users')
    .select('id, nick, avatar_url, deleted_at')
    .in('id', uniq)
    .returns<UserProfileMiniRow[]>()
  if (error || !data) return []
  return data.map(row => ({
    id: row.id,
    nick: row.deleted_at ? DELETED_USER_NICK : row.nick,
    avatar_url: row.avatar_url,
  }))
}

export async function loadFriendships(userId: string): Promise<FriendshipsData> {
  const { data, error } = await supabase
    .from('friendships')
    .select('id, user_a, user_b, status')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .returns<FriendshipRow[]>()

  if (error) return { incoming: [], outgoing: [], friends: [], nickById: {}, avatarById: {} }

  const rows = data ?? []
  const incoming = rows
    .filter(r => r.status === 'pending' && r.user_b === userId)
    .map(mapFriendshipRowToFriendship)
  const outgoing = rows
    .filter(r => r.status === 'pending' && r.user_a === userId)
    .map(mapFriendshipRowToFriendship)
  const friends = rows.filter(r => r.status === 'accepted').map(mapFriendshipRowToFriendship)

  const need = new Set<string>()
  for (const r of [...incoming, ...outgoing, ...friends]) {
    if (r.userAId === userId) need.add(r.userBId)
    else if (r.userBId === userId) need.add(r.userAId)
  }
  need.add(userId)

  const profiles = await loadProfilesByIds([...need])
  const nickById = Object.fromEntries(profiles.map(p => [p.id, p.nick]))
  const avatarById = Object.fromEntries(profiles.map(p => [p.id, p.avatar_url]))
  return { incoming, outgoing, friends, nickById, avatarById }
}

export async function loadNicksByIds(ids: string[]): Promise<Record<string, string>> {
  const uniq = [...new Set(ids)].filter(Boolean)
  if (uniq.length === 0) return {}
  const { data, error } = await supabase.from('users').select('id, nick, deleted_at').in('id', uniq)
  if (error || !data) return {}
  return Object.fromEntries(data.map(u => [u.id, u.deleted_at ? DELETED_USER_NICK : u.nick]))
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
    .returns<FriendshipRow[]>()

  if (error) return []

  const friendRows = rows ?? []
  const mapped = friendRows.map(mapFriendshipRowToFriendship)
  const otherIds = mapped
    .map(f => (f.userAId === userId ? f.userBId : f.userBId === userId ? f.userAId : null))
    .filter((id): id is string => !!id)
  const uniqIds = [...new Set(otherIds)]
  if (uniqIds.length === 0) return []

  const profiles = await loadProfilesByIds(uniqIds)

  const byId = new Map(
    profiles.map(p => [p.id, { nick: p.nick, avatar_url: p.avatar_url }]),
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
