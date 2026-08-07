import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  hero: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerCol: { width: 88, alignItems: 'center' },
  scoreCol: { flex: 1, alignItems: 'center' },
  playerAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  playerAvatarText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  playerName: { marginTop: 8, color: Colors.text, fontSize: 13 },
  playerRate: { marginTop: 4, color: Colors.green, fontSize: 12 },
  bigScore: { color: Colors.text, fontSize: 36, fontWeight: '700' },
  scoreSub: { color: Colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  heroTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.cardAlt,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  heroWin: { height: 6, backgroundColor: Colors.accent },
  heroLoss: { backgroundColor: Colors.cardAlt },
  heroBottom: { marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  metricCol: { flex: 1, alignItems: 'center', gap: 4 },
  metricDivider: { width: 1, height: 32, backgroundColor: Colors.borderSoft },
  metricValue: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  metricLabel: { color: Colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
})
