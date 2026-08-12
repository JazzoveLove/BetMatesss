import { createBet } from './bets.create'
import {
  getBetDetail,
  submitBetResult,
  submitPerMatchBetResult,
  completePerMatchSession,
  getPendingBetResult,
  confirmBetResult,
  disputeBetResult,
  cancelDisputedBet,
  getSettlements,
} from './bets.resolve'
import {
  searchUsers,
  updateBetStatus,
  addParticipant,
  confirmParticipation,
  rejectParticipation,
} from './bets.participants'
import { getDashboardData } from './bets.dashboard'
import { getUserBets } from './bets.userBets'
import {
  getUserBetSummaries,
  getDisciplineStatsForUser,
  getFriendsBalanceLeaderboard,
  getProfileScreenData,
} from './bets.queries'
import { getHistoryForUser } from './bets.history'
import { getProfileStatsV2 } from './bets.profile'

export { createBet, buildParticipantRows } from './bets.create'
export type { ParticipantRow } from '@/features/bets/types/bet.types'

export {
  getBetDetail,
  submitBetResult,
  submitPerMatchBetResult,
  completePerMatchSession,
  getPendingBetResult,
  confirmBetResult,
  disputeBetResult,
  cancelDisputedBet,
  getSettlements,
} from './bets.resolve'
export type { PendingBetResult } from './bets.resolve'

export {
  searchUsers,
  updateBetStatus,
  addParticipant,
  confirmParticipation,
  rejectParticipation,
} from './bets.participants'

export { getDashboardData } from './bets.dashboard'

export { getUserBets } from './bets.userBets'

export {
  getUserBetSummaries,
  getDisciplineStatsForUser,
  getFriendsBalanceLeaderboard,
  getProfileScreenData,
} from './bets.queries'

export { getHistoryForUser, historyBadgeAndAmount } from './bets.history'

export { getProfileStatsV2 } from './bets.profile'

export const BetsService = {
  createBet,
  getBet: getBetDetail,
  getBetDetail,
  getUserBets,
  getUserBetSummaries,
  getHistoryForUser,
  getProfileScreenData,
  updateBetStatus,
  addParticipant,
  confirmParticipation,
  rejectParticipation,
  getSettlements,
  submitBetResult,
  submitPerMatchBetResult,
  completePerMatchSession,
  getPendingBetResult,
  confirmBetResult,
  disputeBetResult,
  cancelDisputedBet,
  getDashboardData,
  getProfileStatsV2,
  searchUsers,
}
