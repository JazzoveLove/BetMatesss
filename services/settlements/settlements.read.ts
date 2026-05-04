/** Odczyt rozliczeń z bazy */

import { supabase } from '../../lib/supabase'
import type { Settlement } from '../../types/bet.types'
import { log } from '../../utils/logger'
import { loadNicksByIds } from '../friends.service'
import type { SettlementListDbRow } from './settlements.types'

export async function getSettlements(betId: string): Promise<Settlement[]> {
  const { data: rows, error } = await supabase
    .from('settlements')
    .select('id, amount, paid, paid_at, debtor_id, creditor_id')
    .eq('bet_id', betId)

  if (error) {
    log('[getSettlements] query error', error)
    return []
  }
  if (!rows?.length) {
    log('[getSettlements] no rows found')
    return []
  }

  const list = rows as SettlementListDbRow[]

  const userIds = [...new Set(list.flatMap(r => [r.debtor_id, r.creditor_id]))]
  log('[getSettlements] loading nicks for userIds', userIds)
  const nickById = userIds.length > 0 ? await loadNicksByIds(userIds) : {}
  log('[getSettlements] nickById', nickById)

  const result = list
    .map(s => {
      const amount = Number(s.amount)
      return {
        id: s.id,
        debtorId: s.debtor_id,
        debtorNick: nickById[s.debtor_id] ?? 'Nieznany',
        creditorId: s.creditor_id,
        creditorNick: nickById[s.creditor_id] ?? 'Nieznany',
        amount: Number.isFinite(amount) ? amount : 0,
        paid: s.paid,
        paidAt: s.paid_at ?? undefined,
      }
    })
    .filter(s => s.amount > 0)

  log('[getSettlements] returning', result)
  return result
}
