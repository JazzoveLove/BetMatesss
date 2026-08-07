import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { hexToRgba } from '@/shared/utils/colors'

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: hexToRgba(Colors.background, 0.75),
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    zIndex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  title: { color: Colors.text, fontSize: 17, fontWeight: '700', marginBottom: 16 },
  qrWrap: {
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  hint: { color: Colors.textMuted, fontSize: 14 },
  closeBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.cardAlt,
  },
  closeBtnText: { color: Colors.accentLight, fontSize: 15, fontWeight: '600' },
})
