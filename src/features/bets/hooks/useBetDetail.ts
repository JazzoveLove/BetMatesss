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
  )

  const {
    resolving,
    confirming,
    disputing,
    cancelling,
    accepting,
    rejecting,
  } =
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
    cancelling,
    pendingResult: data.pendingResult,
    submitResult: actions.submitResult,
    confirmResult: actions.confirmResult,
    disputeResult: actions.disputeResult,
    cancelBet: actions.cancelBet,
    acceptBet: actions.acceptBet,
    rejectBet: actions.rejectBet,
    accepting,
    rejecting,
    reload: data.loadData,
  }
}
