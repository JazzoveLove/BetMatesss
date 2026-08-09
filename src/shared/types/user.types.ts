export type FriendshipStatus = 'pending' | 'accepted'
export type FriendshipRow = {
  id: string
  user_a: string
  user_b: string
  status: FriendshipStatus
}
export type Friendship = {
  id: string
  userAId: string
  userBId: string
  status: FriendshipStatus
}
export type UserProfileRow = {
  id: string
  phone?: string | null
  nick: string
  avatar_url?: string | null
  invite_code?: string | null
  created_at?: string
  deleted_at?: string | null
}
export type UserProfile = {
  id: string
  phone?: string | null
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