import type { FormatViewProps } from '@/features/bets/types/bet.types'
import { SingleMatchView } from './SingleMatchView'

export function SessionView(props: FormatViewProps) {
  return <SingleMatchView {...props} />
}
