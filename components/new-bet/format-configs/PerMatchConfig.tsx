import { Text, TextInput, View } from 'react-native'
import { Colors } from '../../../constants/colors'
import type { FormatConfigProps } from '../formatConfigProps'
import { styles } from '../newBetStepStyles'

export function PerMatchConfig({ state, handlers }: FormatConfigProps) {
  return (
    <View style={styles.perMatchStakeRow}>
      <Text style={styles.perMatchStakeLabel}>Stawka za mecz:</Text>
      <TextInput
        keyboardType="numeric"
        value={String(state.stakePerMatch || '')}
        onChangeText={v => handlers.setStakePerMatch(Number(v) || 0)}
        placeholder="20"
        placeholderTextColor={Colors.textMuted}
        style={styles.perMatchStakeInput}
      />
      <Text style={styles.perMatchStakeSuffix}>zł</Text>
    </View>
  )
}
