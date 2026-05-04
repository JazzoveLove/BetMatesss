import { Pressable, StyleSheet, Text } from 'react-native'
import { Colors } from '../../../constants/colors'
export type CustomGameCardProps = {
  selected: boolean
  onSelect: () => void
}

export function CustomGameCard({ selected, onSelect }: CustomGameCardProps) {
  return (
    <Pressable onPress={onSelect} style={[styles.customCard, selected && styles.customCardSelected]}>
      <Text style={styles.customCardText}>✏️ Własna gra — wpisz nazwę</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
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
})
