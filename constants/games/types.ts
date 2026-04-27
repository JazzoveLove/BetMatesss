import type { BetFormat, PokerMode, ResultType } from '../../types/bet.types'

export type WinCondition = 'higher_score' | 'most_legs' | 'most_sets' | 'winner_only' | 'chip_count'

export interface GameTemplate {
  id: string
  name: string
  emoji: string
  category: 'sport' | 'planszowe' | 'video' | 'inne'
  resultType: ResultType
  defaultFormat: BetFormat
  defaultBestOf?: number
  availableFormats: BetFormat[]
  scoringLabel: string | null
  winCondition: WinCondition
  supportsTeams: boolean
  supportsRematch: boolean
  customName?: boolean
  pokerModes?: PokerMode[]
  supportsRebuy?: boolean
  defaultStack?: number
  defaultRebuyStack?: number
}
