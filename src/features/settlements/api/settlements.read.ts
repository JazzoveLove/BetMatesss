
import { supabase } from '@/shared/lib/supabase'
import type { Settlement } from '@/features/bets/types/bet.types'
import { loadNicksByIds } from '@/features/friends'
import type { SettlementListDbRow } from './settlements.types'

export async function getSettlements(betId: string): Promise<Settlement[]> {
  const { data: rows, error } = await supabase
    .from('settlements')
    .select('id, amount, debtor_id, creditor_id')
    .eq('bet_id', betId)

  if (error) {
    return []
  }
  if (!rows?.length) {
    return []
  }

  const list = rows as SettlementListDbRow[]

  const userIds = [...new Set(list.flatMap(r => [r.debtor_id, r.creditor_id]))]
  const nickById = userIds.length > 0 ? await loadNicksByIds(userIds) : {}

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
      }
    })
    .filter(s => s.amount > 0)

  return result
}
