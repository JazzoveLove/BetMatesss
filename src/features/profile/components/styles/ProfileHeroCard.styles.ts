import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  heroCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
  heroScore: { color: Colors.text, fontSize: 36, fontWeight: '700' },
  heroLabel: { marginTop: 4, color: Colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  heroTrack: {
    marginTop: 12,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.red,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  heroWin: { height: 5, backgroundColor: Colors.green },
  heroLoss: { backgroundColor: Colors.red },
  heroNeutral: { flex: 1, backgroundColor: 'rgba(232,230,224,0.1)' },
  heroBottom: { marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  heroMetric: { flex: 1, alignItems: 'center', gap: 4 },
  heroDivider: { width: 1, height: 36, backgroundColor: Colors.borderSoft },
  heroMetricValue: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  heroMetricLabel: { color: Colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
})
