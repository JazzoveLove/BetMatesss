import { useMemo, useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GAME_TEMPLATES, type GameTemplate } from '../../constants/games'
import { Colors } from '../../constants/colors'
import type { NewBetHandlers, NewBetState } from '../../hooks/useNewBet'

type Props = {
  state: NewBetState
  onSelect: (game: GameTemplate) => void
  handlers: Pick<NewBetHandlers, 'setSelectedFormat' | 'setStep'>
}

type TileItem = {
  id: string
  label: string
  emoji: string
}

const TILE_ORDER: TileItem[] = [
  { id: 'pilkarzyki', label: 'Piłkarzyki', emoji: '⚽' },
  { id: 'ping_pong', label: 'Ping pong', emoji: '🏓' },
  { id: 'dart', label: 'Dart', emoji: '🎯' },
  { id: 'koszykowka', label: 'Koszykówka', emoji: '🏀' },
  { id: 'szachy', label: 'Szachy', emoji: '♟️' },
  { id: 'poker', label: 'Poker', emoji: '🃏' },
  { id: 'fifa', label: 'Gra video', emoji: '🎮' },
  { id: 'bilard', label: 'Bilard', emoji: '🎱' },
]

function rgbaFromHex(hexColor: string, alpha: number): string {
  const parsed = hexColor.replace('#', '')
  const num = Number.parseInt(parsed, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r},${g},${b},${alpha})`
}

export function StepGame({ state, onSelect, handlers }: Props) {
  const insets = useSafeAreaInsets()
  const [customOpen, setCustomOpen] = useState(state.selectedGame?.id === 'wlasna')
  const [customName, setCustomName] = useState('')
  const scalesRef = useRef<Record<string, Animated.Value>>({})

  const gamesMap = useMemo(
    () => new Map(GAME_TEMPLATES.map(item => [item.id, item])),
    [],
  )
  const recentGameIds = useMemo(() => new Set(state.recentGames.map(game => game.id)), [state.recentGames])

  const selectedLabel = state.selectedGame?.id === 'wlasna'
    ? customName.trim() || 'Własna gra'
    : state.selectedGame?.name

  const ensureScale = (id: string): Animated.Value => {
    if (!scalesRef.current[id]) {
      scalesRef.current[id] = new Animated.Value(1)
    }
    return scalesRef.current[id]
  }

  const animateSelect = (id: string, onDone: () => void) => {
    const scale = ensureScale(id)
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start(onDone)
  }

  const handleTilePress = (id: string) => {
    const game = gamesMap.get(id)
    if (!game) return
    setCustomOpen(false)
    setCustomName('')
    animateSelect(id, () => onSelect(game))
  }

  const handleCustomOpen = () => {
    const own = gamesMap.get('wlasna')
    if (!own) return
    setCustomOpen(true)
    onSelect(own)
  }

  const handleNext = () => {
    if (!state.selectedGame) return
    handlers.setSelectedFormat(null)
    handlers.setStep(2)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>WYBIERZ DYSCYPLINĘ</Text>

      <ScrollView
        style={{ flex: 1 }}
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 100 }}
      >
        <View style={styles.grid}>
          {TILE_ORDER.map(item => {
            const selected = state.selectedGame?.id === item.id
            const recent = recentGameIds.has(item.id)
            const scale = ensureScale(item.id)
            return (
              <Animated.View key={item.id} style={[styles.tileCol, { transform: [{ scale }] }]}>
                <Pressable
                  onPress={() => handleTilePress(item.id)}
                  style={[styles.tile, selected && styles.tileSelected]}
                >
                  {recent && <View style={styles.recentDot} />}
                  <Text style={styles.tileEmoji}>{item.emoji}</Text>
                  <Text style={[styles.tileLabel, selected && styles.tileLabelSelected]}>{item.label}</Text>
                </Pressable>
              </Animated.View>
            )
          })}
        </View>

        <View style={styles.customWrap}>
          <Pressable
            onPress={handleCustomOpen}
            style={[styles.customCard, state.selectedGame?.id === 'wlasna' && styles.customCardSelected]}
          >
            <Text style={styles.customCardText}>✏️ Własna gra — wpisz nazwę</Text>
          </Pressable>
          {(customOpen || state.selectedGame?.id === 'wlasna') && (
            <View style={styles.customInputWrap}>
              <TextInput
                value={customName}
                onChangeText={value => {
                  setCustomName(value)
                  const own = gamesMap.get('wlasna')
                  if (own) onSelect(own)
                }}
                placeholder="Np. Rzuty wolne, Pompki challenge..."
                placeholderTextColor={Colors.textMuted}
                style={styles.customInput}
                autoFocus
              />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 6 }]}>
        <View style={styles.footerFade} />
        <Pressable
          onPress={handleNext}
          disabled={!state.selectedGame}
          style={[styles.nextButton, !state.selectedGame && styles.nextButtonDisabled]}
        >
          <Text style={[styles.nextMainText, !state.selectedGame && styles.nextMainTextDisabled]}>
            Dalej — wybierz format →
          </Text>
          {!!state.selectedGame && <Text style={styles.nextSubText}>Wybrano: {selectedLabel}</Text>}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  sectionLabel: {
    marginTop: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tileCol: {
    width: '48.5%',
  },
  tile: {
    position: 'relative',
    width: '100%',
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileSelected: {
    borderColor: Colors.accent,
    backgroundColor: rgbaFromHex(Colors.accent, 0.2),
  },
  recentDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentLight,
  },
  tileEmoji: { fontSize: 32 },
  tileLabel: { marginTop: 8, color: Colors.text, fontSize: 13, fontWeight: '700' },
  tileLabelSelected: { color: Colors.accentLight },
  customWrap: { marginHorizontal: 16, marginTop: 10 },
  customCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  customCardSelected: { borderColor: Colors.accent },
  customCardText: { color: Colors.accentLight, fontSize: 14, fontWeight: '600' },
  customInputWrap: { marginTop: 10 },
  customInput: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
  },
  footerFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -16,
    height: 16,
    backgroundColor: rgbaFromHex(Colors.background, 0.6),
  },
  nextButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  nextButtonDisabled: { backgroundColor: Colors.cardAlt },
  nextMainText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  nextMainTextDisabled: { color: Colors.textMuted },
  nextSubText: { color: rgbaFromHex(Colors.text, 0.6), fontSize: 12 },
})
