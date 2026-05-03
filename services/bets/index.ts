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
  markSettlementPaid,
} from './bets.resolve'
export type { PendingBetResult } from './bets.resolve'

export {
  searchUsers,
  updateBetStatus,
  addParticipant,
  confirmParticipation,
  rejectParticipation,
} from './bets.participants'

export {
  getDashboardData,
  getUserBets,
  getUserBetSummaries,
  getHistoryForUser,
  getDisciplineStatsForUser,
  getFriendsBalanceLeaderboard,
  getProfileScreenData,
} from './bets.queries'

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
  markSettlementPaid,
} from './bets.resolve'
import {
  searchUsers,
  updateBetStatus,
  addParticipant,
  confirmParticipation,
  rejectParticipation,
} from './bets.participants'
import {
  getDashboardData,
  getUserBets,
  getUserBetSummaries,
  getHistoryForUser,
  getDisciplineStatsForUser,
  getFriendsBalanceLeaderboard,
  getProfileScreenData,
} from './bets.queries'

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
  markSettlementPaid,
  getDashboardData,
  searchUsers,
}
