import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'

export type FriendStatCardFriend = {
  id: string
  nick: string
  initials: string
  totalMatches: number
  wins: number
  losses: number
  winRate: number
  balance: number
  lastActivityLabel: string
}

export type FriendStatCardProps = {
  friend: FriendStatCardFriend
  onPress: () => void
}

/** Style wspólne z wierszem „Zagraj!” na liście znajomych */
export const friendRowSharedStyles = StyleSheet.create({
  friendCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: Colors.accentLight, fontSize: 16, fontWeight: '700' },
  friendMiddle: { flex: 1, marginLeft: 12 },
  friendTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  friendNick: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  friendSub: { marginTop: 4, color: Colors.textMuted, fontSize: 12 },
})

const styles = StyleSheet.create({
  winRate: { fontSize: 15, fontWeight: '700' },
  progressTrack: {
    marginTop: 8,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: Colors.cardAlt,
    flexDirection: 'row',
  },
  progressWin: { height: 4, backgroundColor: Colors.green },
  progressLoss: { backgroundColor: Colors.cardAlt },
  statsRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaText: { color: Colors.textMuted, fontSize: 11 },
  balanceText: { fontSize: 13, fontWeight: '700' },
})

export function FriendStatCard({ friend, onPress }: FriendStatCardProps) {
  const progress = useRef(new Animated.Value(0)).current
  const ratio = friend.totalMatches > 0 ? friend.wins / friend.totalMatches : 0

  useEffect(() => {
    Animated.timing(progress, {
      toValue: ratio,
      duration: 500,
      useNativeDriver: false,
    }).start()
  }, [progress, ratio])

  const winRateColor = friend.winRate >= 60 ? Colors.green : friend.winRate >= 40 ? Colors.amber : Colors.red
  const balanceColor = friend.balance > 0 ? Colors.green : friend.balance < 0 ? Colors.red : Colors.textMuted
  const balanceLabel = friend.balance > 0 ? `+${friend.balance} zł` : `${friend.balance} zł`

  return (
    <Pressable style={friendRowSharedStyles.friendCard} onPress={onPress}>
      <View style={friendRowSharedStyles.avatarBubble}>
        <Text style={friendRowSharedStyles.avatarInitials}>{friend.initials}</Text>
      </View>
      <View style={friendRowSharedStyles.friendMiddle}>
        <View style={friendRowSharedStyles.friendTopRow}>
          <Text style={friendRowSharedStyles.friendNick}>{friend.nick}</Text>
          <Text style={[styles.winRate, { color: winRateColor }]}>{friend.winRate}%</Text>
        </View>
        <Text style={friendRowSharedStyles.friendSub}>
          {friend.totalMatches} meczów razem · ostatni: {friend.lastActivityLabel}
        </Text>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressWin,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          <View style={[styles.progressLoss, { flex: Math.max(0, 1 - ratio) }]} />
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.metaText}>
            {friend.wins}W {friend.losses}P
          </Text>
          <Text style={[styles.balanceText, { color: balanceColor }]}>{balanceLabel}</Text>
        </View>
      </View>
    </Pressable>
  )
}
