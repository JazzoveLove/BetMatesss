import { Pressable, Text, View } from 'react-native'
import { rivalryScreenStyles as styles } from './rivalryScreen.styles'

export type RivalryBottomActionsProps = {
  paddingBottom: number
  onNewBet: () => void
  onRematch: () => void
}

export function RivalryBottomActions({ paddingBottom, onNewBet, onRematch }: RivalryBottomActionsProps) {
  return (
    <View style={[styles.bottomActions, { paddingBottom }]}>
      <Pressable style={styles.newBetBtn} onPress={onNewBet}>
        <Text style={styles.newBetText}>+ Nowy zakład</Text>
      </Pressable>
      <Pressable style={styles.rematchBtn} onPress={onRematch}>
        <Text style={styles.rematchText}>🔄 Rewanż</Text>
      </Pressable>
    </View>
  )
}
