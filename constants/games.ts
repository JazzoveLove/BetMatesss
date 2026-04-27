import { BOARD_GAME_TEMPLATES } from './games/board'
import { CUSTOM_GAME_TEMPLATES } from './games/custom'
import { SPORT_GAME_TEMPLATES } from './games/sport'
import type { GameTemplate } from './games/types'
import { VIDEO_GAME_TEMPLATES } from './games/video'

export type { GameTemplate, WinCondition } from './games/types'

export const GAME_TEMPLATES: GameTemplate[] = [
  ...SPORT_GAME_TEMPLATES,
  ...BOARD_GAME_TEMPLATES,
  ...VIDEO_GAME_TEMPLATES,
  ...CUSTOM_GAME_TEMPLATES,
]

export const GAME_MAP = Object.fromEntries(
  GAME_TEMPLATES.map(game => [game.id, { emoji: game.emoji, label: game.name }]),
) as Record<string, { emoji: string; label: string }>
