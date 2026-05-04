import { useBetDetailActions } from './useBetDetailActions'
import { useBetDetailData } from './useBetDetailData'
import { useBetDetailRealtime } from './useBetDetailRealtime'

export function useBetDetail(betId: string) {
  const data = useBetDetailData(betId)
  useBetDetailRealtime(betId, data.loadData)
  const actions = useBetDetailActions(
    betId,
    data.bet,
    data.currentUserId,
    data.pendingResult,
    data.score,
    data.setScore,
    data.setAction,
    data.loadData,
    data.setSettlements,
  )

  const { resolving, confirming, disputing, accepting, rejecting, completingSession, markingPaid, reminding } =
    data.actionLoading

  return {
    loading: data.loading,
    bet: data.bet,
    settlements: data.settlements,
    currentUserId: data.currentUserId,
    score: data.score,
    setScore: data.setScore,
    resolving,
    confirming,
    disputing,
    markingPaid,
    reminding,
    pendingResult: data.pendingResult,
    submitResult: actions.submitResult,
    confirmResult: actions.confirmResult,
    disputeResult: actions.disputeResult,
    markPaid: actions.markPaid,
    sendReminder: actions.sendReminder,
    acceptBet: actions.acceptBet,
    rejectBet: actions.rejectBet,
    accepting,
    rejecting,
    submitPerMatchResult: actions.submitPerMatchResult,
    completeMatchSession: actions.completeMatchSession,
    completingSession,
    reload: data.loadData,
  }
}
