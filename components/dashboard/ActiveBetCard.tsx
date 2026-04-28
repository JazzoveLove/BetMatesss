import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'

export type ActiveDashboardBet = {
  id: string
  opponentNick: string
  opponentInitials: string
  game: string
  amount: number
  timeLabel: string
  status: 'pending' | 'active' | 'enter_result'
}

type Props = {
  item: ActiveDashboardBet
  onPress: () => void
}

function rgbaFromHex(hexColor: string, alpha: number): string {
  const parsed = hexColor.replace('#', '')
  const num = Number.parseInt(parsed, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r},${g},${b},${alpha})`
}

function formatAmount(amount: number): string {
  return `${amount} zł`
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

export function ActiveBetCard({ item, onPress }: Props) {
  const statusStyle = STATUS_STYLES[item.status] as { backgroundColor: string; color: string }
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.opponentInitials}</Text>
      </View>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accentLight,
  },
  center: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
})
