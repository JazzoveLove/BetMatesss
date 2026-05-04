import { useMemo } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import type { NewBetHandlers, NewBetState } from '../../hooks/useNewBet'
import { StakeCustomRows } from './stake/StakeCustomRows'
import { StakeEqualRow } from './stake/StakeEqualRow'
import { StakeModePicker } from './stake/StakeModePicker'
import { StakeSummaryCard } from './stake/StakeSummaryCard'
import { stakeStepStyles } from './stake/stakeStyles'
import { StepStakeChips } from './stake/StepStakeChips'
import { StepStakeFooter } from './stake/StepStakeFooter'
import { StepStakeInviteCard } from './stake/StepStakeInviteCard'
import { StepStakeParticipantsSection } from './stake/StepStakeParticipantsSection'
import { stepStakeStyles as styles } from './stake/stepStake.styles'

type Props = { state: NewBetState; handlers: NewBetHandlers }

export function StepStake({ state, handlers }: Props) {
  const {
    selectedGame,
    selectedFormat,
    stakeMode,
    stakeAmount,
    customStakes,
    currentUser,
    participants,
    loading,
  } = state

  const totalPlayers = participants.length + 1
  const myCustomStake = Number(customStakes[currentUser?.id ?? ''] ?? 0)
  const customPool = useMemo(() => {
    const selectedSum = participants.reduce((sum, p) => sum + Number(customStakes[p.id] ?? 0), 0)
    return selectedSum + myCustomStake
  }, [customStakes, myCustomStake, participants])
  const myOdds = myCustomStake > 0 ? customPool / myCustomStake : 0

  const patchCustom = (id: string, amount: number) => {
    handlers.setCustomStakes(prev => ({ ...prev, [id]: amount }))
  }

  return (
    <View style={styles.container}>
      <StepStakeChips selectedGame={selectedGame} selectedFormat={selectedFormat} handlers={handlers} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
        <ScrollView style={{ flex: 1 }} bounces showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 100 }}>
          <StakeModePicker stakeMode={stakeMode} onChange={handlers.setStakeMode} />
          {stakeMode === 'equal' && (
            <StakeEqualRow amount={stakeAmount} onChange={handlers.setStakeAmount} totalPlayers={totalPlayers} />
          )}
          {stakeMode === 'custom' && (
            <StakeCustomRows currentUser={currentUser} participants={participants} customStakes={customStakes} onChange={patchCustom} />
          )}
          <StepStakeParticipantsSection state={state} handlers={handlers} />
          <StepStakeInviteCard />
          {stakeMode === 'custom' && (
            <Text style={stakeStepStyles.customSummary}>
              Pula: {customPool} zł · Twój kurs: {myOdds > 0 ? myOdds.toFixed(2) : '0.00'}×
            </Text>
          )}
          <StakeSummaryCard
            participants={participants}
            currentUser={currentUser}
            stakeMode={stakeMode}
            stakeAmount={stakeAmount}
            customStakes={customStakes}
            selectedGame={selectedGame}
            selectedFormat={selectedFormat}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <StepStakeFooter participants={participants} loading={loading} handlers={handlers} />
    </View>
  )
}
