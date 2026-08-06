export { createBet, buildParticipantRows } from './bets.create'
export { getBetInvitePreview, joinBetFromInvite } from './bets.join'
export type { BetInvitePreview, ParticipantRow } from '@/features/bets/types/bet.types'

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

export { getUserBets } from './bets.userBets'

export {
  getUserBetSummaries,
  getDisciplineStatsForUser,
  getFriendsBalanceLeaderboard,
  getProfileScreenData,
} from './bets.queries'

export { getHistoryForUser, historyBadgeAndAmount } from './bets.history'

export { getProfileStatsV2 } from './bets.profile'

import { createBet } from './bets.create'
import { getBetInvitePreview, joinBetFromInvite } from './bets.join'
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
import { getUserBets } from './bets.userBets'
import {
  getUserBetSummaries,
  getDisciplineStatsForUser,
  getFriendsBalanceLeaderboard,
  getProfileScreenData,
} from './bets.queries'
import { getHistoryForUser } from './bets.history'
import { getProfileStatsV2 } from './bets.profile'

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
  getProfileStatsV2,
  searchUsers,
}
