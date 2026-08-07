import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export function getWinRateColor(rate: number): string {
  if (rate >= 60) return Colors.green
  if (rate >= 40) return Colors.amber
  return Colors.red
}

export const styles = StyleSheet.create({
  sectionLabel: {
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 12,
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  disciplineCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
    flexDirection: 'row',
  },
  emojiBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 24 },
  disciplineMiddle: { flex: 1, marginLeft: 12 },
  disciplineTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disciplineName: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  disciplineRate: { fontSize: 15, fontWeight: '700' },
  disciplineTrack: {
    marginTop: 8,
    marginBottom: 8,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: Colors.red,
    flexDirection: 'row',
  },
  disciplineWin: { backgroundColor: Colors.green },
  disciplineLoss: { backgroundColor: Colors.red },
  disciplineBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disciplineMeta: { color: Colors.textMuted, fontSize: 12 },
  disciplineBalance: { fontSize: 12, fontWeight: '600' },
})
