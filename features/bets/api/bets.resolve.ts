export { getSettlements, markAsPaid, confirmPayment, rejectPayment } from '@/services/settlements.service'
export { getBetDetail } from './bets.resolve.detail'
export type { PendingBetResult } from './bets.resolve.results'
export {
  submitBetResult,
  submitPerMatchBetResult,
  completePerMatchSession,
  getPendingBetResult,
  confirmBetResult,
  disputeBetResult,
} from './bets.resolve.results'
