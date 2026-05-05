export { createBet, getBetInvitePreview, joinBetFromInvite, buildParticipantRows } from './bets.create'
export type { BetInvitePreview, ParticipantRow } from './bets.create'

export {
  getBetDetail,
  submitBetResult,
  submitPerMatchBetResult,
  completePerMatchSession,
  getPendingBetResult,
  confirmBetResult,
  disputeBetResult,
  getSettlements,
  markAsPaid,
  confirmPayment,
  rejectPayment,
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

export {
  getUserBets,
  getUserBetSummaries,
  getDisciplineStatsForUser,
  getFriendsBalanceLeaderboard,
  getProfileScreenData,
} from './bets.queries'

export { getHistoryForUser, historyBadgeAndAmount } from './bets.history'

import { createBet, getBetInvitePreview, joinBetFromInvite } from './bets.create'
import {
  getBetDetail,
  submitBetResult,
  submitPerMatchBetResult,
  completePerMatchSession,
  getPendingBetResult,
  confirmBetResult,
  disputeBetResult,
  getSettlements,
  markAsPaid,
  confirmPayment,
  rejectPayment,
} from './bets.resolve'
import {
  searchUsers,
  updateBetStatus,
  addParticipant,
  confirmParticipation,
  rejectParticipation,
} from './bets.participants'
import { getDashboardData } from './bets.dashboard'
import {
  getUserBets,
  getUserBetSummaries,
  getDisciplineStatsForUser,
  getFriendsBalanceLeaderboard,
  getProfileScreenData,
} from './bets.queries'
import { getHistoryForUser } from './bets.history'

export const BetsService = {
  createBet,
  getBetInvitePreview,
  joinBetFromInvite,
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
  markAsPaid,
  confirmPayment,
  rejectPayment,
  getDashboardData,
  searchUsers,
}
