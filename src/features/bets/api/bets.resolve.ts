export { getSettlements } from '@/features/settlements'
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
