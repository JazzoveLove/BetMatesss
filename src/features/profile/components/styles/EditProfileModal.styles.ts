import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { hexToRgba } from '@/shared/utils/colors'

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: hexToRgba(Colors.background, 0.7),
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: 12,
    color: Colors.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  counter: { fontSize: 12, color: Colors.textFaint, textAlign: 'right', marginTop: 6 },
  modalActions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  modalAction: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalActionText: { color: Colors.text, fontSize: 13, fontWeight: '700' },
})
