import type { FormatViewProps } from '@/features/bets/types/bet.types'
import { SingleMatchView } from './SingleMatchView'

/** Tymczasowo ten sam przepływ co single — podmień na dedykowany UI przy implementacji RR. */
export function RoundRobinView(props: FormatViewProps) {
  return <SingleMatchView {...props} />
}
