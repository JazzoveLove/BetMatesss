import { Image, Pressable, Text, View } from 'react-native'
import { friendRowSharedStyles } from './styles/FriendStatCard.styles'
import { styles } from './styles/FriendRowCard.styles'

export type FriendRowCardFriend = {
  id: string
  nick: string
  initials: string
  avatarUrl?: string
}

export type FriendRowCardProps = {
  friend: FriendRowCardFriend
  onPress?: () => void
  sent?: boolean
}

export function FriendRowCard({ friend, onPress, sent }: FriendRowCardProps) {
  return (
    <Pressable
      style={[friendRowSharedStyles.friendCard, sent && styles.sentCard]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[friendRowSharedStyles.avatarBubble, styles.avatarClip]}>
        {friend.avatarUrl ? (
          <Image source={{ uri: friend.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={friendRowSharedStyles.avatarInitials}>{friend.initials}</Text>
        )}
      </View>
      <View style={friendRowSharedStyles.friendMiddle}>
        <Text style={friendRowSharedStyles.friendNick}>{friend.nick}</Text>
        {sent && <Text style={styles.sentLabel}>Zaproszono</Text>}
      </View>
    </Pressable>
  )
}
