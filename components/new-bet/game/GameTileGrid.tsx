import { useRef } from 'react'
import { Animated, Pressable, Text, View } from 'react-native'
import type { GameTemplate } from '../../../constants/games'
import { gameScreenStyles as styles } from './gameScreen.styles'

export type GameTileDisplay = { label: string; emoji: string }

export type GameTileGridProps = {
  games: GameTemplate[]
  tileDisplayById: Record<string, GameTileDisplay>
  recentGameIds: Set<string>
  selectedGameId: string | undefined
  onSelect: (game: GameTemplate) => void
}

export function GameTileGrid({ games, tileDisplayById, recentGameIds, selectedGameId, onSelect }: GameTileGridProps) {
  const scalesRef = useRef<Record<string, Animated.Value>>({})

  const ensureScale = (id: string): Animated.Value => {
    if (!scalesRef.current[id]) scalesRef.current[id] = new Animated.Value(1)
    return scalesRef.current[id]
  }

  const animateAndSelect = (game: GameTemplate) => {
    const scale = ensureScale(game.id)
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start(() => onSelect(game))
  }

  return (
    <View style={styles.grid}>
      {games.map(game => {
        const display = tileDisplayById[game.id] ?? { label: game.name, emoji: game.emoji }
        const selected = selectedGameId === game.id
        const recent = recentGameIds.has(game.id)
        const scale = ensureScale(game.id)
        return (
          <Animated.View key={game.id} style={[styles.tileCol, { transform: [{ scale }] }]}>
            <Pressable onPress={() => animateAndSelect(game)} style={[styles.tile, selected && styles.tileSelected]}>
              {recent && <View style={styles.recentDot} />}
              <Text style={styles.tileEmoji}>{display.emoji}</Text>
              <Text style={[styles.tileLabel, selected && styles.tileLabelSelected]}>{display.label}</Text>
            </Pressable>
          </Animated.View>
        )
      })}
    </View>
  )
}
