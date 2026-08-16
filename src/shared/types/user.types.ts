import type { Tables } from '@/shared/types/database_types'

export type UserProfileRow = Tables<'users'>

export type UserProfile = {
  id: string
  nick: string
  avatarUrl?: string | null
  inviteCode?: string | null
  createdAt?: string
}
