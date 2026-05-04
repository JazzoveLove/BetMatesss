import { useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../../constants/colors'
import type { BetFormat } from '../../../types/bet.types'
import type { FormatMeta } from '../../../constants/formats'
import { rgbaFromHex } from '../stake/stakeStyles'

export type FormatOptionListProps = {
  formats: FormatMeta[]
  selected: BetFormat | null
  activeFormat: BetFormat
  onSelect: (f: BetFormat) => void
}

export function FormatOptionList({ formats, selected: _selected, activeFormat, onSelect }: FormatOptionListProps) {
  const scalesRef = useRef<Record<string, Animated.Value>>({})

  const ensureScale = (id: string): Animated.Value => {
    if (!scalesRef.current[id]) scalesRef.current[id] = new Animated.Value(1)
    return scalesRef.current[id]
  }

  const handleFormatSelect = (formatId: BetFormat) => {
    const scale = ensureScale(formatId)
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.98, duration: 50, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start(() => onSelect(formatId))
  }

  return (
    <View style={styles.listWrap}>
      {formats.map(item => {
        const isSelected = activeFormat === item.id
        const scale = ensureScale(item.id)
        return (
          <Animated.View key={item.id} style={{ transform: [{ scale }] }}>
            <Pressable onPress={() => handleFormatSelect(item.id)} style={[styles.formatRow, isSelected && styles.formatRowSelected]}>
              <View style={styles.formatIconBox}>
                <Text style={styles.formatIcon}>{item.icon}</Text>
              </View>
              <View style={styles.formatMain}>
                <Text style={styles.formatName}>{item.name}</Text>
                <Text style={styles.formatDesc}>{item.description}</Text>
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>{isSelected && <Text style={styles.radioCheck}>✓</Text>}</View>
            </Pressable>
          </Animated.View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  listWrap: { gap: 8, flex: 1 },
  formatRow: {
    minHeight: 56,
    borderRadius: 14,
    padding: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
  },
  formatRowSelected: { backgroundColor: rgbaFromHex(Colors.accent, 0.12), borderColor: Colors.accent },
  formatIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatIcon: { fontSize: 18 },
  formatMain: { flex: 1, marginHorizontal: 12 },
  formatName: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  formatDesc: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.accent, backgroundColor: Colors.accent },
  radioCheck: { color: Colors.white, fontSize: 12, fontWeight: '700' },
})
