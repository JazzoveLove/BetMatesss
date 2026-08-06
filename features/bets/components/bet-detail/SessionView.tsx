import type { FormatViewProps } from '@/features/bets/types/bet.types'
import { SingleMatchView } from './SingleMatchView'

/** Tymczasowo ten sam przepływ co single — podmień na widok sesji gdy będzie gotowy. */
export function SessionView(props: FormatViewProps) {
  return <SingleMatchView {...props} />
}
