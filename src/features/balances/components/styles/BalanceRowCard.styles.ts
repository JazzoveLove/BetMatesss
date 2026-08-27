import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  avatarClip: { overflow: 'hidden' },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  matchCount: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  balanceValue: { fontSize: 15, fontWeight: '700' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowMarginBottom: { marginBottom: 10 },
})
