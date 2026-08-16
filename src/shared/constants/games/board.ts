import type { GameTemplate } from './types'

export const BOARD_GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'szachy',
    name: 'Szachy',
    emoji: '♟️',
    category: 'planszowe',
    resultType: 'winner_only',
    scoringLabel: null,
  },
  {
    id: 'uno',
    name: 'UNO',
    emoji: '🃏',
    category: 'planszowe',
    resultType: 'winner_only',
    scoringLabel: null,
  },
]
