import type { BetFormat } from '../../../types/bet.types'

export const FORMAT_STEP_LABELS: Record<BetFormat, string> = {
  single: 'Jeden mecz',
  best_of: 'Best of X',
  per_match: 'Zakład za mecz',
  round_robin: 'Round Robin',
  elimination: 'Eliminacje',
  session: 'Sesja wielu gier',
}
