export type GameTemplate = {
  id: string
  name: string
  emoji: string
}

export const GAME_TEMPLATES: GameTemplate[] = [
  { id: 'pilkarzyki', name: 'Pilkarzyki', emoji: '⚽' },
  { id: 'ping_pong', name: 'Ping pong', emoji: '🏓' },
  { id: 'dart', name: 'Dart', emoji: '🎯' },
  { id: 'koszykowka', name: 'Koszykowka 1v1', emoji: '🏀' },
  { id: 'szachy', name: 'Szachy', emoji: '♟️' },
  { id: 'poker', name: 'Poker', emoji: '🃏' },
  { id: 'gra_video', name: 'Gra video', emoji: '🎮' },
  { id: 'wlasna', name: 'Wlasna gra', emoji: '✏️' },
]

export const GAME_MAP = Object.fromEntries(
  GAME_TEMPLATES.map(game => [game.id, { emoji: game.emoji, label: game.name }]),
) as Record<string, { emoji: string; label: string }>
