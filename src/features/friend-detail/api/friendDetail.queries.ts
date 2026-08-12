import { supabase } from '@/shared/lib/supabase'
import { DELETED_USER_NICK } from '@/shared/constants/user/deletedUser'

export type PairDisciplineStat = {
  gameTemplate: string
  wins: number
  losses: number
}

export type PairDetail = {
  friendNick: string
  balance: number
  stats: PairDisciplineStat[]
}

export async function getPairDetail(viewerId: string, otherId: string): Promise<PairDetail> {
  const [friendRes, balanceRes, statsRes] = await Promise.all([
    supabase.from('users').select('nick, deleted_at').eq('id', otherId).maybeSingle(),
    supabase.rpc('get_pair_balance', { p_viewer: viewerId, p_other: otherId }),
    supabase.rpc('get_pair_stats', { p_viewer: viewerId, p_other: otherId }),
  ])

  if (friendRes.error) throw friendRes.error
  if (balanceRes.error) throw balanceRes.error
  if (statsRes.error) throw statsRes.error

  const friendRow = friendRes.data as { nick: string; deleted_at: string | null } | null
  const friendNick = friendRow?.deleted_at ? DELETED_USER_NICK : friendRow?.nick ?? 'Znajomy'

  const stats: PairDisciplineStat[] = (statsRes.data ?? []).map(row => ({
    gameTemplate: row.game_template,
    wins: row.wins,
    losses: row.losses,
  }))

  return {
    friendNick,
    balance: balanceRes.data ?? 0,
    stats,
  }
}