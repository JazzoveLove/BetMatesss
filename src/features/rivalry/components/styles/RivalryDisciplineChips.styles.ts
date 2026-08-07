import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { hexToRgba } from '@/shared/utils/colors'

export const styles = StyleSheet.create({
  chipsRow: { marginTop: 12, paddingHorizontal: 16 },
  chipsInner: { flexDirection: 'row', alignItems: 'center' },
  chip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipSoftActive: { backgroundColor: hexToRgba(Colors.accent, 0.2), borderColor: Colors.accent },
  chipText: { color: Colors.textMuted, fontSize: 13 },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  chipSoftTextActive: { color: Colors.accentLight, fontWeight: '700' },
})
