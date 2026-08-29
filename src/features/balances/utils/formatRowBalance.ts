import { Colors } from '@/shared/constants/colors'

/**
 * MINUS SIGN (U+2212), nie ASCII-owy dywiz (U+002D) — dywiz przy liczbie
 * czyta się jak myślnik/łącznik, minus jest węższy i wyrównany do plusa.
 */
const MINUS_SIGN = '−'

export type RowBalanceDisplay = {
  text: string
  color: string
  isZero: boolean
}

/**
 * Formatuje saldo w wierszu listy znajomych.
 *
 * Zero to brak otwartego salda, a nie kwota — dlatego "na zero" zamiast
 * mylącego "0 j." (ta sama zasada, którą przyjęliśmy dla "bez stawki" na
 * Historii). `formatBalance` z shared/utils/money celowo zostaje nietknięte,
 * bo ekran znajomego i profil zależą od jego dotychczasowego zachowania.
 */
export function formatRowBalance(balance: number): RowBalanceDisplay {
  if (balance > 0) return { text: `+${balance} j.`, color: Colors.green, isZero: false }
  if (balance < 0) return { text: `${MINUS_SIGN}${Math.abs(balance)} j.`, color: Colors.red, isZero: false }
  return { text: 'na zero', color: Colors.textMuted, isZero: true }
}
