import type { Tables, TablesInsert } from '@/shared/types/database_types'

// Row DB — pochodne z wygenerowanych typów Supabase (baza jest źródłem prawdy,
// patrz supabase/migrations/20260810120000_baseline_schema.sql).
// Literały węższe niż to, co generator widzi jako "string" (bo CHECK-i w bazie
// nie trafiają do generowanych typów) odtwarzamy ręcznie tam, gdzie kod na nich polega.

export type BetRow = Omit<Tables<'bets'>, 'format' | 'stake_mode' | 'status'> & {
  format: 'single'
  stake_mode: 'none' | 'equal'
  status:
    | 'pending'
    | 'active'
    | 'awaiting_confirmation'
    | 'completed'
    | 'disputed'
    | 'rejected'
}

// Znormalizowany widok wyniku używany w warstwie UI/rozliczeń — węższy niż pełny
// wiersz bet_results (bez kolumn audytowych, których te miejsca nie potrzebują),
// ze scores zawężonym do kształtu faktycznie zapisywanego przez submit_bet_result.
export type BetResultRow = Pick<
  Tables<'bet_results'>,
  'id' | 'bet_id' | 'match_number' | 'winner_id' | 'confirmed'
> & {
  scores: { score: string }
}

export type ParticipantRow = Omit<Tables<'bet_participants'>, 'role'> & {
  role: 'creator' | 'participant'
}

// Wiersz do insertu bet_participants — bez `id` (generowane przez bazę).
export type ParticipantInsertRow = Omit<TablesInsert<'bet_participants'>, 'role'> & {
  role: 'creator' | 'participant'
}
