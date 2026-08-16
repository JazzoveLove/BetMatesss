import { Pressable, Text, View } from 'react-native'
import type { Friendship } from '@/features/friends/types/friendship.types'
import { styles } from './styles/FriendPendingCard.styles'

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
