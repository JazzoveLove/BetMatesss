import { DELETED_USER_NICK } from '@/shared/constants/user/deletedUser'
import type { UserProfile, UserProfileRow } from '@/shared/types/user.types'

export function mapUserProfileRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    nick: row.deleted_at ? DELETED_USER_NICK : row.nick,
    avatarUrl: row.avatar_url ?? undefined,
    inviteCode: row.invite_code ?? undefined,
    createdAt: row.created_at ?? undefined,
  }
}
