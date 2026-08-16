import type { GameTemplate } from './types'

export const VIDEO_GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'clash_royale',
    name: 'Clash Royale',
    emoji: '🏰',
    category: 'video',
    resultType: 'score',
    scoringLabel: 'Korony',
  },
  {
    id: 'fifa',
    name: 'FIFA / EA FC',
    emoji: '⚽🎮',
    category: 'video',
    resultType: 'score',
    scoringLabel: 'Bramki',
  },
  {
    id: 'bijatyki',
    name: 'Bijatyki (Tekken/SF)',
    emoji: '🥊',
    category: 'video',
    resultType: 'winner_only',
    scoringLabel: null,
  },
  {
    id: 'rocket_league',
    name: 'Rocket League',
    emoji: '🚗',
    category: 'video',
    resultType: 'score',
    scoringLabel: 'Bramki',
  },
  {
    id: 'nba2k',
    name: 'NBA 2K',
    emoji: '🏀🎮',
    category: 'video',
    resultType: 'score',
    scoringLabel: 'Punkty',
  },
]
