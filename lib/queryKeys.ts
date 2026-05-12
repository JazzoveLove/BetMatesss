export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  history: (userId: string) => ['history', userId] as const,
  dashboard: (userId: string) => ['dashboard', userId] as const,
  rivalry: (userId: string, friendId: string) => ['rivalry', userId, friendId] as const,
  betInvites: (userId: string) => ['betInvites', userId] as const,
  friends: (userId: string) => ['friends', userId] as const,
  bets: (userId: string) => ['bets', userId] as const,
  betDetail: (betId: string) => ['betDetail', betId] as const,
}
