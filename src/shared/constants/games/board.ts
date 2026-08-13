import type { GameTemplate } from './types'

export const BOARD_GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'szachy',
    name: 'Szachy',
    emoji: '♟️',
    category: 'planszowe',
    resultType: 'winner_only',
    defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'session'],
    scoringLabel: null,
    winCondition: 'winner_only',
    supportsTeams: false,
    supportsRematch: true,
  },
  {
    id: 'uno',
    name: 'UNO',
    emoji: '🃏',
    category: 'planszowe',
    resultType: 'winner_only',
    defaultFormat: 'single',
    availableFormats: ['single', 'session'],
    scoringLabel: null,
    winCondition: 'winner_only',
    supportsTeams: false,
    supportsRematch: false,
  },
]
