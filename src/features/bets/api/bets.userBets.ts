import { supabase } from '@/shared/lib/supabase'
import type { BetRow, BetSummary } from '@/features/bets/types/bet.types'

// created_at w bazie nie ma NOT NULL (kolumna ma tylko `default now()`, patrz
// supabase/migrations/20260810120000_baseline_schema.sql), więc generator typów Supabase
// widzi ją jako `string | null`. W praktyce żaden kod aplikacji nie wstawia tu null —
// zawsze wypełnia ją default bazy — więc traktujemy null jako naruszenie invariantu
// i rzucamy błąd, zamiast dopuszczać null w BetSummary.createdAt i przerzucać
// obsługę tego przypadku na każdego konsumenta w UI.
function requireCreatedAt(row: BetRow): string {
  if (row.created_at == null) {
    throw new Error(`Bet ${row.id} ma created_at = null, co nie powinno się zdarzyć`)
  }
  return row.created_at
}

function mapBetRowToBetSummary(row: BetRow): BetSummary {
  return {
    id: row.id,
    creatorId: row.creator_id,
    gameTemplate: row.game_template,
    format: row.format,
    stakeMode: row.stake_mode,
    status: row.status,
    createdAt: requireCreatedAt(row),
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
    .sort((a, b) => requireCreatedAt(b).localeCompare(requireCreatedAt(a)))
    .map(mapBetRowToBetSummary)
}
