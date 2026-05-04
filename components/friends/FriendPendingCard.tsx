import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { hexToRgba } from '../../utils/colors'
import type { Friendship } from '../../types/user.types'

export type FriendPendingCardItem = {
  id: string
  nick: string
  status: 'pending_received' | 'pending_sent'
  row: Friendship
}

export type FriendPendingCardProps = {
  item: FriendPendingCardItem
  onAccept: (row: Friendship) => void
  onReject: (row: Friendship) => void
}

const styles = StyleSheet.create({
  pendingCard: {
    opacity: 0.7,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.white, 0.15),
    borderStyle: 'dashed',
    padding: 16,
  },
  pendingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pendingNick: { color: Colors.textMuted, fontSize: 15 },
  pendingSub: { marginTop: 4, color: Colors.textMuted, fontSize: 12 },
  pendingBadge: { backgroundColor: Colors.cardAlt, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12 },
  pendingBadgeText: { color: Colors.textMuted, fontSize: 12 },
  pendingActions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  acceptBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: hexToRgba(Colors.green, 0.15),
  },
  acceptText: { color: Colors.green, fontSize: 13, fontWeight: '700' },
  rejectBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: hexToRgba(Colors.red, 0.15),
  },
  rejectText: { color: Colors.red, fontSize: 13, fontWeight: '700' },
})

export function FriendPendingCard({ item, onAccept, onReject }: FriendPendingCardProps) {
  return (
    <View style={styles.pendingCard}>
      <View style={styles.pendingTop}>
        <View>
          <Text style={styles.pendingNick}>{item.nick}</Text>
          <Text style={styles.pendingSub}>Zaproszenie oczekuje</Text>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>Oczekuje</Text>
        </View>
      </View>
      {item.status === 'pending_received' && (
        <View style={styles.pendingActions}>
          <Pressable style={styles.acceptBtn} onPress={() => void onAccept(item.row)}>
            <Text style={styles.acceptText}>Akceptuj</Text>
          </Pressable>
          <Pressable style={styles.rejectBtn} onPress={() => void onReject(item.row)}>
            <Text style={styles.rejectText}>Odrzuć</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
