import type { FormatViewProps } from '../../types/bet.types'
import { SingleMatchView } from './SingleMatchView'

/** Tymczasowo ten sam przepływ co single — podmień na dedykowany UI drabinki później. */
export function EliminationView(props: FormatViewProps) {
  return <SingleMatchView {...props} />
}
