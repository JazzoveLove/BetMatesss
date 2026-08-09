import { Image, Text, View } from 'react-native'
import { styles } from './styles/ProfileHeader.styles'

export type ProfileHeaderProps = {
  initials: string
  displayNick: string
  memberSince: string
  displayAvatar: string | null
}

export function ProfileHeader({
  initials,
  displayNick,
  memberSince,
  displayAvatar,
}: ProfileHeaderProps) {
  return (
    <View style={styles.avatarSection}>
      <View style={styles.avatar}>
        {displayAvatar ? (
          <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>
      <Text style={styles.nick}>{displayNick}</Text>
      <Text style={styles.memberSince}>w BetMates od {memberSince}</Text>
    </View>
  )
}
