import type { GameTemplate } from './types'

export const CUSTOM_GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'wlasna',
    name: 'Własna gra',
    emoji: '✏️',
    category: 'inne',
    resultType: 'winner_only',
    defaultFormat: 'single',
    availableFormats: ['single', 'best_of', 'per_match', 'session'],
    scoringLabel: null,
    winCondition: 'winner_only',
    supportsTeams: true,
    supportsRematch: false,
    customName: true,
  },
]
