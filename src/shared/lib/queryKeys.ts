export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  history: (userId: string) => ['history', userId] as const,
  dashboard: (userId: string) => ['dashboard', userId] as const,
  friendDetail: (userId: string, friendId: string) => ['friendDetail', userId, friendId] as const,
  friendHistory: (userId: string, friendId: string) => ['friendHistory', userId, friendId] as const,
  betInvites: (userId: string) => ['betInvites', userId] as const,
  friends: (userId: string) => ['friends', userId] as const,
  myInviteCode: (userId: string) => ['myInviteCode', userId] as const,
  bets: (userId: string) => ['bets', userId] as const,
  balances: (userId: string) => ['balances', userId] as const,
  pendingActions: (userId: string) => ['pendingActions', userId] as const,
  betDetail: (betId: string) => ['betDetail', betId] as const,
}
