import { GAME_TEMPLATES, type GameTemplate } from '../../../constants/games'
import type { GameTileDisplay } from './GameTileGrid'

export const STEP_GAME_TILE_ORDER: { id: string; label: string; emoji: string }[] = [
  { id: 'pilkarzyki', label: 'Piłkarzyki', emoji: '⚽' },
  { id: 'ping_pong', label: 'Ping pong', emoji: '🏓' },
  { id: 'dart', label: 'Dart', emoji: '🎯' },
  { id: 'koszykowka', label: 'Koszykówka', emoji: '🏀' },
  { id: 'szachy', label: 'Szachy', emoji: '♟️' },
  { id: 'poker', label: 'Poker', emoji: '🃏' },
  { id: 'fifa', label: 'Gra video', emoji: '🎮' },
  { id: 'bilard', label: 'Bilard', emoji: '🎱' },
]

export function buildGamesMap() {
  return new Map(GAME_TEMPLATES.map(item => [item.id, item]))
}

export function buildOrderedGames(gamesMap: Map<string, GameTemplate>) {
  return STEP_GAME_TILE_ORDER.map(t => gamesMap.get(t.id)).filter(Boolean) as GameTemplate[]
}

export function buildTileDisplayById(): Record<string, GameTileDisplay> {
  return Object.fromEntries(STEP_GAME_TILE_ORDER.map(t => [t.id, { label: t.label, emoji: t.emoji }]))
}
