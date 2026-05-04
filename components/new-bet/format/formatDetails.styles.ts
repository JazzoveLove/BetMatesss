import { StyleSheet } from 'react-native'
import { Colors } from '../../../constants/colors'
import { rgbaFromHex } from '../stake/stakeStyles'

export const formatDetailsStyles = StyleSheet.create({
  detailsCard: {
    marginHorizontal: 0,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  detailsHeader: {
    marginBottom: 12,
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  detailsBody: { gap: 10 },
  rowLabel: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  toggleButton: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1 },
  toggleActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  toggleMuted: { backgroundColor: Colors.cardAlt, borderColor: Colors.borderSoft },
  toggleText: { fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: Colors.white },
  toggleTextMuted: { color: Colors.textMuted },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stakeInput: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.text,
    fontSize: 15,
  },
  suffix: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  sessionInfo: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 8 },
})
