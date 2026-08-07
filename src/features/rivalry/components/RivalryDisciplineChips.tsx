import { Pressable, ScrollView, Text, View } from 'react-native'
import { GAME_MAP } from '@/shared/constants/games'
import { styles } from './styles/RivalryDisciplineChips.styles'

export type RivalryDisciplineChipsProps = {
  disciplines: string[]
  selected: string | null
  onSelect: (d: string | null) => void
}

export function RivalryDisciplineChips({ disciplines, selected, onSelect }: RivalryDisciplineChipsProps) {
  return (
    <View style={styles.chipsRow}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipsInner}>
          <Pressable style={[styles.chip, !selected && styles.chipActive]} onPress={() => onSelect(null)}>
            <Text style={[styles.chipText, !selected && styles.chipTextActive]}>Wszystkie</Text>
          </Pressable>
          {disciplines.map(gameId => {
            const active = gameId === selected
            return (
              <Pressable
                key={gameId}
                style={[styles.chip, active && styles.chipSoftActive]}
                onPress={() => onSelect(gameId)}
              >
                <Text style={[styles.chipText, active && styles.chipSoftTextActive]}>
                  {GAME_MAP[gameId]?.emoji ?? '🎲'} {GAME_MAP[gameId]?.label ?? gameId}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}
