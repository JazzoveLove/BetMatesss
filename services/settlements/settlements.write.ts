/** Oznaczanie rozliczeń jako zapłacone */

import { supabase } from '../../lib/supabase'
import { log } from '../../utils/logger'

/**
 * Tylko dłużnik może oznaczyć zapłatę (RLS + filtr debtor_id).
 */
export async function markSettlementPaid(
  settlementId: string,
  debtorId: string,
): Promise<{ error?: string }> {
  log('[markSettlementPaid] start', { settlementId, debtorId })

  const { error } = await supabase
    .from('settlements')
    .update({ paid: true, paid_at: new Date().toISOString() })
    .eq('id', settlementId)
    .eq('debtor_id', debtorId)

  if (error) {
    log('[markSettlementPaid] error', error)
    return { error: error.message }
  }

  log('[markSettlementPaid] success', { settlementId })
  return {}
}
