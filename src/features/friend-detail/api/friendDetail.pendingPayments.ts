import { supabase } from '@/shared/lib/supabase'

export type PairPendingPayment = {
  id: string
  fromUser: string
  toUser: string
  amount: number
  createdBy: string
  createdAt: string | null
}

type PendingPaymentRow = {
  id: string
  from_user: string
  to_user: string
  amount: number | string
  created_by: string
  created_at: string | null
}

/**
 * Wiszące (status='pending') spłaty między dwiema osobami, w dowolną stronę.
 * Fail-open: błąd zapytania → pusta lista (jak getSettlements / getHistoryForPair)
 * — brak sekcji potwierdzania jest mniej mylący niż wywalony ekran znajomego.
 */
export async function getPairPendingPayments(
  viewerId: string,
  otherId: string,
): Promise<PairPendingPayment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, from_user, to_user, amount, created_by, created_at')
    .eq('status', 'pending')
    .is('deleted_at', null)
    .or(
      `and(from_user.eq.${viewerId},to_user.eq.${otherId}),` +
        `and(from_user.eq.${otherId},to_user.eq.${viewerId})`,
    )

  if (error) return []

  return ((data ?? []) as PendingPaymentRow[]).map(row => ({
    id: row.id,
    fromUser: row.from_user,
    toUser: row.to_user,
    amount: Number(row.amount),
    createdBy: row.created_by,
    createdAt: row.created_at,
  }))
}
