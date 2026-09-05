export type PendingActionKind = 'bet_invite' | 'result_confirm' | 'dispute' | 'payment_confirm'

export type PendingAction = {
  kind: PendingActionKind
  /**
   * Zakład, którego dotyczy sprawa. NULL dla 'payment_confirm' — spłata nie
   * jest przypisana do żadnego zakładu (wtedy niesie ją paymentId).
   */
  betId: string | null
  /** Ustawione WYŁĄCZNIE dla 'payment_confirm' — id wiszącej płatności. */
  paymentId: string | null
  /**
   * Druga strona sprawy (przeciwnik / zapraszający / dłużnik). NULL tylko przy
   * zakładzie bez innego uczestnika — w praktyce nie występuje, ale RPC nie
   * wymusza tego przez LEFT JOIN, więc typ to dopuszcza.
   */
  otherId: string | null
  /** Nick drugiej strony; fallback 'Znajomy', gdy profilu nie da się ustalić. */
  otherNickname: string
  otherAvatarUrl: string | null
  /** NULL dla 'payment_confirm' (spłata nie ma dyscypliny) oraz przy stake_mode='none'. */
  gameTemplate: string | null
  /** stake_per_match z zakładu; dla 'payment_confirm' — kwota spłaty; NULL przy stake_mode='none'. */
  stake: number | null
  createdAt: string | null
}

export type PendingActionCounts = {
  total: number
  bet_invite: number
  result_confirm: number
  dispute: number
  payment_confirm: number
}
