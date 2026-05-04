import { useMemo } from 'react'
import { Text, TextInput, View } from 'react-native'
import { Colors } from '../../../constants/colors'
import { stakeStepStyles as styles } from './stakeStyles'

export type StakeEqualRowProps = {
  amount: number
  onChange: (amount: number) => void
  totalPlayers: number
}

export function StakeEqualRow({ amount, onChange, totalPlayers }: StakeEqualRowProps) {
  const equalPool = useMemo(() => (Number(amount) || 0) * totalPlayers, [amount, totalPlayers])

  return (
    <View style={styles.equalRow}>
      <Text style={styles.equalLabel}>Stawka za osobę</Text>
      <TextInput
        keyboardType="numeric"
        value={amount > 0 ? String(amount) : ''}
        onChangeText={v => onChange(Number(v) || 0)}
        placeholder="0"
        placeholderTextColor={Colors.textMuted}
        style={styles.equalInput}
      />
      <Text style={styles.equalSuffix}>zł</Text>
      <Text style={styles.poolAccent}>Pula: {equalPool} zł</Text>
    </View>
  )
}
