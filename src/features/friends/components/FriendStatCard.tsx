import { useEffect, useRef } from 'react'
import { Animated, Pressable, Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { friendRowSharedStyles, styles } from './styles/FriendStatCard.styles'

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
