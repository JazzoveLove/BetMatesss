import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'

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

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center', marginTop: 20, marginBottom: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: Colors.white, fontSize: 28, fontWeight: '700' },
  nick: { marginTop: 12, color: Colors.text, fontSize: 20, fontWeight: '700' },
  memberSince: { marginTop: 4, color: Colors.textMuted, fontSize: 13 },
})
