import { Image, Pressable, Text, View } from 'react-native'
import { styles } from './styles/ProfileHeader.styles'

export type ProfileHeaderProps = {
  initials: string
  displayNick: string
  memberSince: string
  displayAvatar: string | null
  onPickAvatar: () => void
}

export function ProfileHeader({
  initials,
  displayNick,
  memberSince,
  displayAvatar,
  onPickAvatar,
}: ProfileHeaderProps) {
  return (
    <View style={styles.avatarSection}>
      <Pressable style={styles.avatar} onPress={onPickAvatar}>
        {displayAvatar ? (
          <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </Pressable>
      <Text style={styles.nick}>{displayNick}</Text>
      <Text style={styles.memberSince}>w BetMates od {memberSince}</Text>
    </View>
  )
}
