import { useMemo } from 'react'
import { Text, View } from 'react-native'
import type { GameTemplate } from '@/shared/constants/games'
import type { StakeMode } from '@/features/bets/types/bet.types'
import type { UserProfile } from '@/shared/types/user.types'
import { stakeStepStyles as styles } from './styles/stakeStyles'

export type StakeSummaryCardProps = {
  participants: UserProfile[]
  currentUser: UserProfile | null
  stakeMode: StakeMode
  stakeAmount: number
  customStakes: Record<string, number>
  selectedGame: GameTemplate | null
}

export function StakeSummaryCard({
  participants,
  currentUser,
  stakeMode,
  stakeAmount,
  customStakes,
  selectedGame,
}: StakeSummaryCardProps) {
  const totalPlayers = participants.length + 1
  const equalPool = useMemo(() => (Number(stakeAmount) || 0) * totalPlayers, [stakeAmount, totalPlayers])
  const myCustomStake = Number(customStakes[currentUser?.id ?? ''] ?? 0)
  const customPool = useMemo(() => {
    const selectedSum = participants.reduce((sum, p) => sum + Number(customStakes[p.id] ?? 0), 0)
    return selectedSum + myCustomStake
  }, [customStakes, myCustomStake, participants])

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryHeader}>PODSUMOWANIE ZAKŁADU</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Gra</Text>
        <Text style={styles.summaryValue}>
          {selectedGame ? `${selectedGame.emoji} ${selectedGame.name}` : '—'}
        </Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Stawka</Text>
        {stakeMode === 'none' ? (
          <Text style={styles.summaryMuted}>Bez stawki</Text>
        ) : stakeMode === 'equal' ? (
          <Text style={styles.summaryValue}>
            {stakeAmount || 0} j. / osoba · pula {equalPool} j.
          </Text>
        ) : (
          <Text style={styles.summaryValue}>
            {myCustomStake} j. / osoba · pula {customPool} j.
          </Text>
        )}
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Uczestnicy</Text>
        <Text style={styles.summaryParticipants}>
          {participants.length === 0
            ? 'Ty'
            : participants.length === 1
              ? `Ty + ${participants[0].nick}`
              : `Ty + ${participants.length} osób`}
        </Text>
      </View>
    </View>
  )
}
