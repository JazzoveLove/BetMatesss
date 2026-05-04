import { useRef } from 'react'
import { Animated, Pressable, Text, View } from 'react-native'
import type { StakeMode } from '../../../types/bet.types'
import { stakeStepStyles as styles } from './stakeStyles'

type StakeModeCard = { id: StakeMode; name: string; description: string }

const STAKE_MODES: StakeModeCard[] = [
  { id: 'none', name: 'Bez stawki', description: 'Tylko statystyki' },
  { id: 'equal', name: 'Równe', description: 'Wszyscy po tyle samo' },
  { id: 'custom', name: 'Własny kurs', description: 'Różne kwoty' },
]

export type StakeModePickerProps = {
  stakeMode: StakeMode
  onChange: (mode: StakeMode) => void
}

export function StakeModePicker({ stakeMode, onChange }: StakeModePickerProps) {
  const modeScaleRef = useRef<Record<string, Animated.Value>>({})

  const modeScale = (id: string): Animated.Value => {
    if (!modeScaleRef.current[id]) modeScaleRef.current[id] = new Animated.Value(1)
    return modeScaleRef.current[id]
  }

  const onModePress = (mode: StakeMode) => {
    const scale = modeScale(mode)
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 50, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start(() => onChange(mode))
  }

  return (
    <>
      <Text style={styles.sectionLabel}>TRYB STAWKI</Text>
      <View style={styles.modeRow}>
        {STAKE_MODES.map(mode => {
          const selected = stakeMode === mode.id
          return (
            <Animated.View key={mode.id} style={[styles.modeCol, { transform: [{ scale: modeScale(mode.id) }] }]}>
              <Pressable onPress={() => onModePress(mode.id)} style={[styles.modeCard, selected && styles.modeCardSelected]}>
                <Text style={[styles.modeTitle, selected && styles.modeTitleSelected]}>{mode.name}</Text>
                <Text style={[styles.modeDesc, selected && styles.modeDescSelected]}>{mode.description}</Text>
              </Pressable>
            </Animated.View>
          )
        })}
      </View>
    </>
  )
}
