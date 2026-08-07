import { Pressable, Text } from 'react-native'
import { styles } from './styles/CustomGameCard.styles'
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
