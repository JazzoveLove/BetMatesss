export type FriendshipStatus = 'pending' | 'accepted'

export type FriendshipRow = {
  id: string
  user_a: string
  user_b: string
  status: FriendshipStatus
}

export type UserProfile = {
  id: string
  phone?: string | null
  nick: string
  avatarUrl?: string | null
  avatar_url?: string | null
  inviteCode?: string | null
  invite_code?: string | null
  created_at?: string
}

export type UserStats = {
  totalBets: number
  wonBets: number
  lostBets: number
  winRate: number
  balance: number
}
