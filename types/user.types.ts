export type FriendshipStatus = 'pending' | 'accepted'
/** Surowa odpowiedź z Supabase — używaj tylko w services/ */
export type FriendshipRow = {
  id: string
  user_a: string
  user_b: string
  status: FriendshipStatus
}
/** Relacja znajomości dla hooks/ i UI — mapowana w services (bez snake_case z DB). */
export type Friendship = {
  id: string
  userAId: string
  userBId: string
  status: FriendshipStatus
}
/** Surowa odpowiedź z Supabase — używaj tylko w services/ */
export type UserProfileRow = {
  id: string
  phone?: string | null
  nick: string
  avatar_url?: string | null
  invite_code?: string | null
  created_at?: string
}
/** Zmapowany obiekt — używaj w hooks/ i components/ */
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
