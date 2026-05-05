/** Handshake potwierdzenia zapłaty rozliczeń */

import { supabase } from '../../lib/supabase'
import { log } from '../../utils/logger'

export async function markAsPaid(
  settlementId: string,
  debtorId: string,
): Promise<{ error?: string }> {
  log('[markAsPaid] start', { settlementId, debtorId })

  const { error } = await supabase
    .from('settlements')
    .update({
      payment_status: 'pending_confirmation',
      confirmed_by: null,
      confirmed_at: null,
    })
    .eq('id', settlementId)
    .eq('debtor_id', debtorId)
    .eq('payment_status', 'unpaid')

  if (error) {
    log('[markAsPaid] error', error)
    return { error: error.message }
  }

  log('[markAsPaid] success', { settlementId })
  return {}
}

export async function confirmPayment(
  settlementId: string,
  creditorId: string,
): Promise<{ error?: string }> {
  log('[confirmPayment] start', { settlementId, creditorId })

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('settlements')
    .update({
      payment_status: 'paid',
      paid: true,
      paid_at: now,
      confirmed_by: creditorId,
      confirmed_at: now,
    })
    .eq('id', settlementId)
    .eq('creditor_id', creditorId)
    .eq('payment_status', 'pending_confirmation')

  if (error) {
    log('[confirmPayment] error', error)
    return { error: error.message }
  }

  log('[confirmPayment] success', { settlementId })
  return {}
}

export async function rejectPayment(
  settlementId: string,
  creditorId: string,
): Promise<{ error?: string }> {
  log('[rejectPayment] start', { settlementId, creditorId })

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('settlements')
    .update({
      payment_status: 'disputed',
      paid: false,
      paid_at: null,
      confirmed_by: creditorId,
      confirmed_at: now,
    })
    .eq('id', settlementId)
    .eq('creditor_id', creditorId)
    .eq('payment_status', 'pending_confirmation')

  if (error) {
    log('[rejectPayment] error', error)
    return { error: error.message }
  }

  log('[rejectPayment] success', { settlementId })
  return {}
}
