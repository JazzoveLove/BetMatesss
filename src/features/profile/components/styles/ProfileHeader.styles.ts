import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
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
