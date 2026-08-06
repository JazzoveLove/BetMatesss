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
  payments: RivalryPaymentRow[]
}

export type RivalryTotals = {
  wins: number
  losses: number
  winRatePct: number
  balance: number
}

export type RivalryPaymentRow = {
  betId: string
  fromUserId: string
  toUserId: string
  amount: number
  paymentStatus: 'unpaid' | 'pending_confirmation' | 'paid' | 'disputed'
}
