export { getSettlements } from '@/features/settlements'
export { getBetDetail } from './bets.resolve.detail'
export type { PendingBetResult } from './bets.resolve.results'
export {
  submitBetResult,
  getPendingBetResult,
  confirmBetResult,
  disputeBetResult,
  cancelDisputedBet,
} from './bets.resolve.results'