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

export const styles = StyleSheet.create({
  winRate: { fontSize: 15, fontWeight: '700' },
  progressTrack: {
    marginTop: 8,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: Colors.cardAlt,
    flexDirection: 'row',
  },
  progressWin: { height: 4, backgroundColor: Colors.green },
  progressLoss: { backgroundColor: Colors.cardAlt },
  statsRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaText: { color: Colors.textMuted, fontSize: 11 },
  balanceText: { fontSize: 13, fontWeight: '700' },
})
