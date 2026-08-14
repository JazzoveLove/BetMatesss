import { Pressable, Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { rgbaFromHex, styles } from './styles/ActiveBetCard.styles'

export type ActiveDashboardBet = {
  id: string
  opponentNick: string
  opponentInitials: string
  opponentId: string
  game: string
  amount: number
  timeLabel: string
  status: 'pending' | 'active' | 'enter_result'
}

type Props = {
  item: ActiveDashboardBet
  onPress: () => void
  onAvatarPress: () => void
}

function formatAmount(amount: number): string {
  return `${amount} j.`
}

const STATUS_COPY: Record<ActiveDashboardBet['status'], string> = {
  pending: 'Oczekuje',
  active: 'Aktywny',
  enter_result: 'Wpisz wynik',
}

const STATUS_STYLES: Record<ActiveDashboardBet['status'], object> = {
  pending: { backgroundColor: rgbaFromHex(Colors.amber, 0.15), color: Colors.amber },
  active: { backgroundColor: rgbaFromHex(Colors.accentLight, 0.15), color: Colors.accentLight },
  enter_result: { backgroundColor: Colors.accent, color: Colors.white },
}

export function ActiveBetCard({ item, onPress, onAvatarPress }: Props) {
  const statusStyle = STATUS_STYLES[item.status] as { backgroundColor: string; color: string }
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {item.opponentId ? (
        <Pressable onPress={onAvatarPress} style={styles.avatar}>
          <Text style={styles.avatarText}>{item.opponentInitials}</Text>
        </Pressable>
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.opponentInitials}</Text>
        </View>
      )}
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {item.game} vs {item.opponentNick}
        </Text>
        <Text style={styles.subtitle}>
          {formatAmount(item.amount)} | {item.timeLabel}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: statusStyle.backgroundColor }]}>
        <Text style={[styles.badgeText, { color: statusStyle.color }]}>{STATUS_COPY[item.status]}</Text>
      </View>
    </Pressable>
  )
}
