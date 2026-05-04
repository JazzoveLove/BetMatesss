import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { GAME_MAP } from '../../constants/games'
import { hexToRgba } from '../../utils/colors'

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

const styles = StyleSheet.create({
  chipsRow: { marginTop: 12, paddingHorizontal: 16 },
  chipsInner: { flexDirection: 'row', alignItems: 'center' },
  chip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipSoftActive: { backgroundColor: hexToRgba(Colors.accent, 0.2), borderColor: Colors.accent },
  chipText: { color: Colors.textMuted, fontSize: 13 },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  chipSoftTextActive: { color: Colors.accentLight, fontWeight: '700' },
})
