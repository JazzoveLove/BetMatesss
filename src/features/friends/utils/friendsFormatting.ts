import type { Friendship } from '@/features/friends/types/friendship.types'

export function otherId(row: Friendship, me: string): string {
  return row.userAId === me ? row.userBId : row.userAId
}

export function formatInviteCodeDisplay(code: string): string {
  if (code.length <= 4) return code
  return `${code.slice(0, 4)}-${code.slice(4)}`
}
