import type { FormatViewProps } from '../../types/bet.types'
import { SingleMatchView } from './SingleMatchView'

/** Obecnie ten sam przepływ co pojedynczy mecz — osobny wpis w mapie pod przyszłe rozróżnienie. */
export function BestOfView(props: FormatViewProps) {
  return <SingleMatchView {...props} />
}
