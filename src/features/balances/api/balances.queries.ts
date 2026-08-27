import { supabase } from '@/shared/lib/supabase'
import { getAcceptedFriendsList } from '@/features/friends'
import type { BalanceRow } from '@/features/balances/types/balance.types'

export async function getBalancesScreenData(userId: string): Promise<BalanceRow[]> {
  const [friends, balancesRes, matchCountsRes] = await Promise.all([
    getAcceptedFriendsList(userId),
    supabase.rpc('get_balances_with_friends', { p_viewer: userId }),
    supabase.rpc('get_match_counts_with_friends', { p_viewer: userId }),
  ])
  if (balancesRes.error) throw balancesRes.error
  if (matchCountsRes.error) throw matchCountsRes.error

  const balanceById = new Map<string, number>(
    ((balancesRes.data ?? []) as { other_id: string; balance: number }[]).map(r => [r.other_id, Number(r.balance)]),
  )
  const matchCountById = new Map<string, number>(
    ((matchCountsRes.data ?? []) as { other_id: string; match_count: number }[]).map(r => [r.other_id, Number(r.match_count)]),
  )

  return friends.map(f => ({
    id: f.id,
    nick: f.nick,
    avatarUrl: f.avatar_url ?? null,
    balance: balanceById.get(f.id) ?? 0,
    matchCount: matchCountById.get(f.id) ?? 0,
  }))
}
