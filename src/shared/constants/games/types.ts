import type { ResultType } from '@/features/bets/types/bet.types'

export interface GameTemplate {
  id: string
  name: string
  emoji: string
  category: 'sport' | 'planszowe' | 'video' | 'inne'
  resultType: ResultType
  scoringLabel: string | null
  customName?: boolean
}
