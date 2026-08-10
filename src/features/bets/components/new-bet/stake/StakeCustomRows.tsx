import { Text, TextInput, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import type { UserProfile } from '@/shared/types/user.types'
import { stakeStepStyles as styles } from './styles/stakeStyles'

export type StakeCustomRowsProps = {
  currentUser: UserProfile | null
  participants: UserProfile[]
  customStakes: Record<string, number>
  onChange: (id: string, amount: number) => void
}

export function StakeCustomRows({ currentUser, participants: _participants, customStakes, onChange }: StakeCustomRowsProps) {
  if (!currentUser) return null
  return (
    <View style={styles.customStakeRow}>
      <Text style={styles.customStakeLabel}>Twoja stawka</Text>
      <TextInput
        keyboardType="number-pad"
        value={customStakes[currentUser.id] ? String(customStakes[currentUser.id]) : ''}
        onChangeText={v => onChange(currentUser.id, Number(v) || 0)}
        placeholder="0"
        placeholderTextColor={Colors.textMuted}
        style={styles.customStakeInput}
      />
      <Text style={styles.equalSuffix}>j.</Text>
    </View>
  )
}
