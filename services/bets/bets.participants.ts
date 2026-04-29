import { supabase } from '../../lib/supabase'
import type { BetStatus } from '../../types/bet.types'
import { log } from '../../utils/logger'

export async function searchUsers(
  query: string,
  excludeIds: string[],
): Promise<{ id: string; nick: string }[]> {
  if (query.trim().length < 2) return []
  const { data } = await supabase
    .from('users')
    .select('id, nick')
    .ilike('nick', `%${query.trim()}%`)
    .limit(5)
  const excludeSet = new Set(excludeIds)
  return (data ?? []).filter(u => !excludeSet.has(u.id))
}

export async function updateBetStatus(id: string, status: BetStatus): Promise<void> {
  await supabase.from('bets').update({ status }).eq('id', id)
}

export async function addParticipant(
  betId: string,
  userId: string,
  stake: number,
): Promise<{ error?: string }> {
  const { error } = await supabase.from('bet_participants').insert({
    bet_id: betId,
    user_id: userId,
    stake_amount: stake,
    odds: 0,
    role: 'participant',
    confirmed: false,
  })
  return error ? { error: error.message } : {}
}

export async function confirmParticipation(betId: string, userId: string): Promise<{ error?: string }> {
  log('[confirmParticipation] start', { betId, userId })
  log('[confirmParticipation] updating participant confirmed=true', { betId, userId })
  const { error: confirmError } = await supabase
    .from('bet_participants')
    .update({ confirmed: true })
    .eq('bet_id', betId)
    .eq('user_id', userId)
  if (confirmError) log('[confirmParticipation] update confirmed failed', confirmError)

  if (confirmError) return { error: confirmError.message }
  log('[confirmParticipation] update confirmed success')

  const { data: allParticipants, error: allError } = await supabase
    .from('bet_participants')
    .select('confirmed')
    .eq('bet_id', betId)
  log('[confirmParticipation] all participants confirmed rows', allParticipants)

  if (allError) return { error: allError.message }

  const everyoneConfirmed = ((allParticipants ?? []) as { confirmed: boolean }[]).every(p => p.confirmed)
  log('[confirmParticipation] everyone confirmed?', { betId, everyoneConfirmed })
  if (everyoneConfirmed) {
    log('[confirmParticipation] updating bet status to active', { betId })
    const { error: statusError } = await supabase
      .from('bets')
      .update({ status: 'active' })
      .eq('id', betId)
      .eq('status', 'pending')
    if (statusError) log('[confirmParticipation] update bet status failed', statusError)
    if (statusError) return { error: statusError.message }
    log('[confirmParticipation] update bet status success')
  }

  log('[confirmParticipation] done', { betId, userId })
  return {}
}

export async function rejectParticipation(betId: string, userId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('bet_participants')
    .delete()
    .eq('bet_id', betId)
    .eq('user_id', userId)
  return error ? { error: error.message } : {}
}
