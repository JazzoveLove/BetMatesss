import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topZone: { paddingHorizontal: 16 },
  topRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  closeIcon: { color: Colors.textMuted, fontSize: 20, fontWeight: '700' },
  title: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  progressRow: { marginTop: 8, flexDirection: 'row', gap: 6 },
  progressSegment: { flex: 1 },
  progressLabel: { color: Colors.textMuted, fontSize: 11, marginBottom: 4 },
  progressLabelActive: { color: Colors.text, fontWeight: '700' },
  progressBar: { height: 3, borderRadius: 2 },
  progressDone: { backgroundColor: Colors.green },
  progressActive: { backgroundColor: Colors.accent },
  progressIdle: { backgroundColor: Colors.cardAlt },
})
