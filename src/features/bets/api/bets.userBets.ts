import { supabase } from '@/shared/lib/supabase'
import type { BetRow, BetSummary } from '@/features/bets/types/bet.types'

function mapBetRowToBetSummary(row: BetRow): BetSummary {
  return {
    id: row.id,
    creatorId: row.creator_id,
    gameTemplate: row.game_template,
    format: row.format,
    stakeMode: row.stake_mode,
    status: row.status,
    createdAt: row.created_at,
    rejectedAt: row.rejected_at ?? undefined,
  }
}

export async function getUserBets(userId: string): Promise<BetSummary[]> {
  const [createdRes, participantsRes] = await Promise.all([
    supabase.from('bets').select('*').eq('creator_id', userId).order('created_at', { ascending: false }),
    supabase
      .from('bet_participants')
      .select('bets(*)')
      .eq('user_id', userId),
  ])
  if (createdRes.error) throw createdRes.error
  if (participantsRes.error) throw participantsRes.error

  const created = (createdRes.data ?? []) as BetRow[]
  const participated = ((participantsRes.data ?? []) as { bets: BetRow | BetRow[] | null }[])
    .flatMap(row => (Array.isArray(row.bets) ? row.bets : row.bets ? [row.bets] : []))
  const byId = new Map<string, BetRow>()
  for (const bet of [...created, ...participated]) byId.set(bet.id, bet)
  return [...byId.values()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(mapBetRowToBetSummary)
}
