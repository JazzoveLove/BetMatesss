export type DisciplineStatRow = {
  gameTemplate: string
  wins: number
  losses: number
  winPct: number
}

export type FriendRankRow = {
  id: string
  nick: string
  balance: number
}

export type DashboardStats = {
  balance: number
  totalBets: number
  winRate: number
}

export type ProfileDisciplineStat = {
  gameTemplate: string
  wins: number
  losses: number
  winPct: number
  balance: number
}

export type ProfileStatSection = {
  wins: number
  losses: number
  winRate: number
  balance: number
  disciplines: ProfileDisciplineStat[]
}

export type ProfileStatsV2 = {
  overall: ProfileStatSection
  money: ProfileStatSection | null
  friendly: ProfileStatSection | null
}

export type ProfileScreenData = {
  nick: string
  createdAt: string | null
  stats: DashboardStats
  disciplines: DisciplineStatRow[]
  friendsRank: FriendRankRow[]
  statsV2: ProfileStatsV2
}
