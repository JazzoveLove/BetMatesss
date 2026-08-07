import { useRef } from 'react'
import { Animated, Pressable, Text, View } from 'react-native'
import type { BetFormat } from '@/features/bets/types/bet.types'
import type { FormatMeta } from '@/shared/constants/formats'
import { styles } from './styles/FormatOptionList.styles'

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
