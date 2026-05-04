import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { BET_FORMATS } from '../../../constants/formats'
import type { GameTemplate } from '../../../constants/games'
import type { BetFormat, StakeMode } from '../../../types/bet.types'
import type { UserProfile } from '../../../types/user.types'
import { stakeStepStyles as styles } from './stakeStyles'

export type StakeSummaryCardProps = {
  participants: UserProfile[]
  currentUser: UserProfile | null
  stakeMode: StakeMode
  stakeAmount: number
  customStakes: Record<string, number>
  selectedGame: GameTemplate | null
  selectedFormat: BetFormat | null
}

export function StakeSummaryCard({
  participants,
  currentUser,
  stakeMode,
  stakeAmount,
  customStakes,
  selectedGame,
  selectedFormat,
}: StakeSummaryCardProps) {
  const totalPlayers = participants.length + 1
  const equalPool = useMemo(() => (Number(stakeAmount) || 0) * totalPlayers, [stakeAmount, totalPlayers])
  const myCustomStake = Number(customStakes[currentUser?.id ?? ''] ?? 0)
  const customPool = useMemo(() => {
    const selectedSum = participants.reduce((sum, p) => sum + Number(customStakes[p.id] ?? 0), 0)
    return selectedSum + myCustomStake
  }, [customStakes, myCustomStake, participants])

  const formatMeta = BET_FORMATS.find(item => item.id === selectedFormat)

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryHeader}>PODSUMOWANIE ZAKŁADU</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Gra</Text>
        <Text style={styles.summaryValue}>
          {selectedGame ? `${selectedGame.emoji} ${selectedGame.name}` : '—'} · {formatMeta?.name ?? '—'}
        </Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Stawka</Text>
        {stakeMode === 'none' ? (
          <Text style={styles.summaryMuted}>Bez stawki</Text>
        ) : stakeMode === 'equal' ? (
          <Text style={styles.summaryValue}>
            {stakeAmount || 0} zł / osoba · pula {equalPool} zł
          </Text>
        ) : (
          <Text style={styles.summaryValue}>
            {myCustomStake} zł / osoba · pula {customPool} zł
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
