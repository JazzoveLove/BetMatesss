import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import OddsPreview from '../OddsPreview'
import { Colors } from '../../constants/colors'
import type { NewBetHandlers, NewBetState } from '../../hooks/useNewBet'
import { styles } from './newBetStepStyles'

type Props = {
  state: NewBetState
  handlers: NewBetHandlers
}

export function StepStake({ state, handlers }: Props) {
  const { stakeMode, stakeAmount, customStakes, currentUser, participants, totalPlayers, loading } = state

  return (
    <ScrollView style={styles.stepBody}>
      <Pressable
        onPress={() => handlers.setStakeMode('none')}
        style={[styles.stakeOption, stakeMode === 'none' && styles.stakeOptionSelected]}
      >
        <Text style={styles.stakeTitle}>Bez stawki</Text>
        <Text style={styles.stakeDesc}>Tylko statystyki</Text>
      </Pressable>

      <Pressable
        onPress={() => handlers.setStakeMode('equal')}
        style={[styles.stakeOption, stakeMode !== 'none' && styles.stakeOptionSelected]}
      >
        <Text style={styles.stakeTitle}>Ze stawka</Text>
        {stakeMode !== 'none' && (
          <View style={styles.stakeConfig}>
            <TextInput
              keyboardType="numeric"
              value={String(stakeAmount || '')}
              onChangeText={v => handlers.setStakeAmount(Number(v) || 0)}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              style={styles.stakeInput}
            />
            <View style={styles.stakeModeRow}>
              <Pressable
                onPress={() => handlers.setStakeMode('equal')}
                style={[styles.modeBtn, stakeMode === 'equal' && styles.modeBtnSelected]}
              >
                <Text style={styles.modeBtnText}>Rowne</Text>
              </Pressable>
              <Pressable
                onPress={() => handlers.setStakeMode('custom')}
                style={[styles.modeBtn, stakeMode === 'custom' && styles.modeBtnSelected]}
              >
                <Text style={styles.modeBtnText}>Wlasny kurs</Text>
              </Pressable>
            </View>
            {stakeMode === 'custom' && (
              <View>
                {[...(currentUser ? [currentUser] : []), ...participants].map(player => (
                  <View key={player.id} style={styles.customStakeRow}>
                    <Text style={styles.customStakeName}>{player.nick}</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={String(customStakes[player.id] ?? '')}
                      onChangeText={v =>
                        handlers.setCustomStakes(prev => ({ ...prev, [player.id]: Number(v) || 0 }))
                      }
                      style={styles.stakeInputSmall}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                ))}
                <OddsPreview stakes={customStakes} users={[...(currentUser ? [currentUser] : []), ...participants]} />
              </View>
            )}
            {stakeMode === 'equal' && stakeAmount > 0 && (
              <Text style={styles.poolPreview}>
                Pula: {stakeAmount * totalPlayers} zl ({totalPlayers} x {stakeAmount} zl)
              </Text>
            )}
          </View>
        )}
      </Pressable>

      <Pressable onPress={() => void handlers.handleSubmit()} disabled={loading} style={styles.submitButton}>
        {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitText}>Wyslij zaklad {'->'}</Text>}
      </Pressable>
    </ScrollView>
  )
}
