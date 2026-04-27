import { Pressable, Text, View } from 'react-native'
import type { FormatConfigProps } from '../formatConfigProps'
import { styles } from '../newBetStepStyles'

export function BestOfConfig({ state, handlers }: FormatConfigProps) {
  return (
    <View style={styles.bestOfPicker}>
      {([3, 5, 7] as const).map(n => (
        <Pressable
          key={n}
          onPress={() => handlers.setBestOfCount(n)}
          style={[styles.bestOfOption, state.bestOfCount === n && styles.bestOfOptionSelected]}
        >
          <Text style={styles.bestOfText}>{n}</Text>
        </Pressable>
      ))}
    </View>
  )
}
