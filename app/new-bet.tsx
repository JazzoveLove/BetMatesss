import { useCallback } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNewBet } from '../hooks/useNewBet'
import { Colors } from '../constants/colors'
import { StepGame } from '../components/new-bet/StepGame'
import { StepFormat } from '../components/new-bet/StepFormat'
import { StepStake } from '../components/new-bet/StepStake'

export default function NewBetScreen() {
  const navigation = useNavigation<any>()
  const { step, state, handlers } = useNewBet()
  const { resetNewBet, setParticipants } = handlers

  useFocusEffect(
    useCallback(() => {
      resetNewBet()

      if (state.preselectedFriend) {
        setParticipants([state.preselectedFriend])
      }
    }, [resetNewBet, setParticipants, state.preselectedFriend]),
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topZone}>
        <View style={styles.topRow}>
          <Pressable style={styles.navBtn} onPress={handlers.handleBack}>
            <Text style={styles.navIcon}>{'<'}</Text>
          </Pressable>
          <Text style={styles.title}>Nowy zakład</Text>
          <Pressable
            style={styles.navBtn}
            onPress={() => {
              try {
                navigation.navigate('Dashboard')
              } catch {
                navigation.navigate('Home')
              }
            }}
          >
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>
        </View>
        <View style={styles.progressRow}>
          <Pressable style={styles.progressSegment} onPress={() => step > 1 && handlers.setStep(1)}>
            <Text style={[styles.progressLabel, step === 1 && styles.progressLabelActive]}>{step > 1 ? '1. Gra ✓' : '1. Gra'}</Text>
            <View style={[styles.progressBar, step > 1 ? styles.progressDone : step === 1 ? styles.progressActive : styles.progressIdle]} />
          </Pressable>
          <Pressable style={styles.progressSegment} onPress={() => step > 2 && handlers.setStep(2)}>
            <Text style={[styles.progressLabel, step === 2 && styles.progressLabelActive]}>{step > 2 ? '2. Format ✓' : '2. Format'}</Text>
            <View style={[styles.progressBar, step > 2 ? styles.progressDone : step === 2 ? styles.progressActive : styles.progressIdle]} />
          </Pressable>
          <View style={styles.progressSegment}>
            <Text style={[styles.progressLabel, step === 3 && styles.progressLabelActive]}>3. Stawki</Text>
            <View style={[styles.progressBar, step === 3 ? styles.progressActive : styles.progressIdle]} />
          </View>
        </View>
      </View>
      {step === 1 && <StepGame state={state} onSelect={handlers.handleGameSelect} handlers={handlers} />}
      {step === 2 && <StepFormat state={state} handlers={handlers} />}
      {step === 3 && <StepStake state={state} handlers={handlers} />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topZone: { paddingHorizontal: 16 },
  topRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  closeIcon: { color: Colors.textMuted, fontSize: 20, fontWeight: '700' },
  title: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  progressRow: { marginTop: 8, flexDirection: 'row', gap: 6 },
  progressSegment: { flex: 1 },
  progressLabel: { color: Colors.textMuted, fontSize: 11, marginBottom: 4 },
  progressLabelActive: { color: Colors.text, fontWeight: '700' },
  progressBar: { height: 3, borderRadius: 2 },
  progressDone: { backgroundColor: Colors.green },
  progressActive: { backgroundColor: Colors.accent },
  progressIdle: { backgroundColor: Colors.cardAlt },
})
