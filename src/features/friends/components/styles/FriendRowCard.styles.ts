import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  sentCard: { opacity: 0.55 },
  sentLabel: { marginTop: 4, color: Colors.textMuted, fontSize: 12 },
  avatarClip: { overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
})
