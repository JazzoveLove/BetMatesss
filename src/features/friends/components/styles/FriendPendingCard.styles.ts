import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { hexToRgba } from '@/shared/utils/colors'

export const styles = StyleSheet.create({
  pendingCard: {
    opacity: 0.7,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.white, 0.15),
    borderStyle: 'dashed',
    padding: 16,
  },
  pendingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pendingNick: { color: Colors.textMuted, fontSize: 15 },
  pendingSub: { marginTop: 4, color: Colors.textMuted, fontSize: 12 },
  pendingBadge: { backgroundColor: Colors.cardAlt, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12 },
  pendingBadgeText: { color: Colors.textMuted, fontSize: 12 },
  pendingActions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  acceptBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: hexToRgba(Colors.green, 0.15),
  },
  acceptText: { color: Colors.green, fontSize: 13, fontWeight: '700' },
  rejectBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: hexToRgba(Colors.red, 0.15),
  },
  rejectText: { color: Colors.red, fontSize: 13, fontWeight: '700' },
})
