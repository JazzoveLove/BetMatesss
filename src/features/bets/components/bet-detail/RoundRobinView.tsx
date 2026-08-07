import type { FormatViewProps } from '@/features/bets/types/bet.types'
import { SingleMatchView } from './SingleMatchView'

export function RoundRobinView(props: FormatViewProps) {
  return <SingleMatchView {...props} />
}
