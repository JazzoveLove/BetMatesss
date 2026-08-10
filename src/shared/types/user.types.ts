import type { Tables } from '@/shared/types/database_types'

export type FriendshipStatus = 'pending' | 'accepted'

export type FriendshipRow = Omit<Tables<'friendships'>, 'status' | 'created_at'> & {
  status: FriendshipStatus
}

export type Friendship = {
  id: string
  userAId: string
  userBId: string
  status: FriendshipStatus
}

export type UserProfileRow = Tables<'users'>

export type UserProfile = {
  id: string
  nick: string
  avatarUrl?: string | null
  inviteCode?: string | null
  createdAt?: string
}

export type UserStats = {
  totalBets: number
  wonBets: number
  lostBets: number
  winRate: number
  balance: number
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
