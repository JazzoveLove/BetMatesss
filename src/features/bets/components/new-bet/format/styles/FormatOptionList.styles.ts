import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { rgbaFromHex } from '../../stake/styles/stakeStyles'

export const styles = StyleSheet.create({
  listWrap: { gap: 8, flex: 1 },
  formatRow: {
    minHeight: 56,
    borderRadius: 14,
    padding: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
  },
  formatRowSelected: { backgroundColor: rgbaFromHex(Colors.accent, 0.12), borderColor: Colors.accent },
  formatIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatIcon: { fontSize: 18 },
  formatMain: { flex: 1, marginHorizontal: 12 },
  formatName: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  formatDesc: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.accent, backgroundColor: Colors.accent },
  radioCheck: { color: Colors.white, fontSize: 12, fontWeight: '700' },
})
