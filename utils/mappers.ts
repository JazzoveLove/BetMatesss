import type { UserProfile, UserProfileRow } from '../types/user.types'

export function mapUserProfileRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    nick: row.nick,
    avatarUrl: row.avatar_url ?? undefined,
    inviteCode: row.invite_code ?? undefined,
    createdAt: row.created_at,
    phone: row.phone ?? undefined,
  }
}
