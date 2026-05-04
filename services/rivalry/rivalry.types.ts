export type RivalryMatchItem = {
  betId: string
  rivalryId: string
  gameTemplate: string
  createdAt: string
  score: string | null
  stakeAmount: number
  profit: number
  outcome: 'win' | 'loss' | 'draw'
}

export type RivalryDisciplineStats = {
  gameTemplate: string
  wins: number
  losses: number
}

export type RivalryData = {
  friendNick: string
  matches: RivalryMatchItem[]
}

export type RivalryTotals = {
  wins: number
  losses: number
  winRatePct: number
  balance: number
}
