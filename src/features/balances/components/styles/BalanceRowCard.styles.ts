import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSoft,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
  avatarInitials: { color: Colors.accentLight, fontSize: 15, fontWeight: '700' },
  middle: { flex: 1, marginLeft: 12 },
  nick: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  matchCount: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  balanceValue: { fontSize: 15, fontWeight: '700', marginLeft: 12 },
  balanceZero: { fontWeight: '600' },
})
