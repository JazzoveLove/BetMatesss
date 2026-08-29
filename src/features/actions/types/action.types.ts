export type PendingActionKind = 'bet_invite' | 'result_confirm' | 'dispute'

export type PendingAction = {
  kind: PendingActionKind
  betId: string
  /**
   * Druga strona sprawy (przeciwnik / zapraszający). NULL tylko przy zakładzie
   * bez innego uczestnika — w praktyce nie występuje, ale RPC nie wymusza tego
   * przez LEFT JOIN, więc typ to dopuszcza.
   */
  otherId: string | null
  /** Pusty string, gdy nie udało się ustalić drugiej strony (patrz otherId). */
  otherNickname: string
  otherAvatarUrl: string | null
  gameTemplate: string
  /** stake_per_match z zakładu; NULL przy stake_mode='none'. */
  stake: number | null
  createdAt: string | null
}

export type PendingActionCounts = {
  total: number
  bet_invite: number
  result_confirm: number
  dispute: number
}
