import { Pressable, Text, TextInput, View } from 'react-native'
import { Colors } from '../../../constants/colors'
import type { FormatConfigProps } from '../formatConfigProps'
import { styles } from '../newBetStepStyles'

export function PokerConfig({ state, handlers }: FormatConfigProps) {
  return (
    <View style={styles.pokerConfig}>
      <Text style={styles.pokerTitle}>Poker konfiguracja</Text>
      <View style={styles.pokerModeRow}>
        <Pressable
          onPress={() => handlers.setPokerMode('winner_takes_all')}
          style={[styles.modeBtn, state.pokerMode === 'winner_takes_all' && styles.modeBtnSelected]}
        >
          <Text style={styles.modeBtnText}>Winner takes all</Text>
        </Pressable>
        <Pressable
          onPress={() => handlers.setPokerMode('chip_count')}
          style={[styles.modeBtn, state.pokerMode === 'chip_count' && styles.modeBtnSelected]}
        >
          <Text style={styles.modeBtnText}>Chip count</Text>
        </Pressable>
      </View>
      <TextInput
        value={String(state.pokerStack)}
        onChangeText={v => handlers.setPokerStack(Number(v) || 0)}
        keyboardType="numeric"
        style={styles.stakeInput}
        placeholder="Stack startowy"
        placeholderTextColor={Colors.textMuted}
      />
      <TextInput
        value={String(state.pokerRebuyStack)}
        onChangeText={v => handlers.setPokerRebuyStack(Number(v) || 0)}
        keyboardType="numeric"
        style={styles.stakeInput}
        placeholder="Rebuy stack"
        placeholderTextColor={Colors.textMuted}
      />
    </View>
  )
}
