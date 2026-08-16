import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

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
