import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { hexToRgba } from '@/shared/utils/colors'

export const styles = StyleSheet.create({
  matchRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: hexToRgba(Colors.white, 0.06),
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchDay: { width: 36, color: Colors.textMuted, fontSize: 12 },
  matchMiddle: { flex: 1, marginLeft: 8 },
  matchMain: { color: Colors.text, fontSize: 14, fontWeight: '500' },
  matchScore: { marginTop: 2, color: Colors.textMuted, fontSize: 12 },
  matchRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultBadgeText: { fontSize: 12, fontWeight: '700' },
  matchAmount: { fontSize: 14, fontWeight: '700' },
})
