import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { GAME_MAP } from '../constants/games'

export type BetStatus =
  | 'pending'
  | 'active'
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'completed'
  | 'disputed'

export type BetCardProps = {
  gameTemplate: string
  opponentNick: string
  stakeAmount: number
  odds: number
  status: BetStatus
  onPress?: () => void
}

const STATUS_CONFIG: Record<BetStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Aktywny',   color: '#7F77DD', bg: '#7F77DD18' },
  in_progress: { label: 'W toku', color: '#7F77DD', bg: '#7F77DD18' },
  pending:   { label: 'Oczekuje',  color: '#EF9F27', bg: '#EF9F2718' },
  awaiting_confirmation: { label: 'Do potwierdzenia', color: '#EF9F27', bg: '#EF9F2718' },
  completed: { label: 'Zakończony', color: 'rgba(232,230,224,0.5)', bg: '#1e2330' },
  disputed:  { label: 'Spór',      color: '#E24B4A', bg: '#E24B4A18' },
}

export default function BetCard({ gameTemplate, opponentNick, stakeAmount, odds, status, onPress }: BetCardProps) {
  const game = GAME_MAP[gameTemplate] ?? { emoji: '🎲', label: gameTemplate }
  const statusCfg = STATUS_CONFIG[status]

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.left}>
        <Text style={styles.emoji}>{game.emoji}</Text>
        <View style={styles.info}>
          <Text style={styles.gameName}>{game.label}</Text>
          <Text style={styles.opponent}>vs {opponentNick}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
        <View style={styles.numbers}>
          <Text style={styles.stake}>{stakeAmount} zł</Text>
          <Text style={styles.odds}>× {odds.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181c24',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#1e2330',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e8e6e0',
    marginBottom: 3,
  },
  opponent: {
    fontSize: 12,
    color: 'rgba(232,230,224,0.5)',
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  numbers: {
    alignItems: 'flex-end',
  },
  stake: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e8e6e0',
  },
  odds: {
    fontSize: 11,
    color: 'rgba(232,230,224,0.5)',
  },
})
