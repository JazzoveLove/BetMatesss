import { useMemo } from 'react'
import { Text, TextInput, View } from 'react-native'
import { Colors } from '../../../constants/colors'
import { stakeStepStyles as styles } from './stakeStyles'

export type StakeEqualRowProps = {
  amount: number
  onChange: (amount: number) => void
  onBlur?: () => void
  totalPlayers: number
  errorMessage?: string | null
}

export function StakeEqualRow({ amount, onChange, onBlur, totalPlayers, errorMessage }: StakeEqualRowProps) {
  const equalPool = useMemo(() => (Number(amount) || 0) * totalPlayers, [amount, totalPlayers])

  return (
    <View style={styles.equalRow}>
      <Text style={styles.equalLabel}>Stawka za osobę</Text>
      <TextInput
        keyboardType="numeric"
        value={amount > 0 ? String(amount) : ''}
        onChangeText={v => onChange(Number(v) || 0)}
        onBlur={onBlur}
        placeholder="0"
        placeholderTextColor={Colors.textMuted}
        style={styles.equalInput}
      />
      <Text style={styles.equalSuffix}>zł</Text>
      <Text style={styles.poolAccent}>Pula: {equalPool} zł</Text>
      {!!errorMessage && <Text style={styles.inlineError}>{errorMessage}</Text>}
    </View>
  )
}
