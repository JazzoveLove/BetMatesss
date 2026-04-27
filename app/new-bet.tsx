import { useCallback } from 'react'
import { Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNewBet } from '../hooks/useNewBet'
import { NewBetHeader } from '../components/new-bet/NewBetHeader'
import { StepGame } from '../components/new-bet/StepGame'
import { StepParticipants } from '../components/new-bet/StepParticipants'
import { StepFormat } from '../components/new-bet/StepFormat'
import { StepStake } from '../components/new-bet/StepStake'
import { styles } from '../components/new-bet/newBetStepStyles'

export default function NewBetScreen() {
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
      <NewBetHeader step={step} onBack={handlers.handleBack} />
      {state.preselectedFriend && step === 1 && (
        <View style={styles.friendBanner}>
          <Text style={styles.friendBannerAvatar}>{state.preselectedFriend.nick[0]?.toUpperCase()}</Text>
          <Text style={styles.friendBannerText}>Nowy mecz z {state.preselectedFriend.nick}</Text>
        </View>
      )}
      {step === 1 && <StepGame state={state} onSelect={handlers.handleGameSelect} handlers={handlers} />}
      {step === 2 && <StepParticipants state={state} handlers={handlers} />}
      {step === 3 && <StepFormat state={state} handlers={handlers} />}
      {step === 4 && <StepStake state={state} handlers={handlers} />}
    </SafeAreaView>
  )
}
