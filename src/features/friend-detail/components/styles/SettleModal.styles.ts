import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { hexToRgba } from '@/shared/utils/colors'

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: hexToRgba(Colors.background, 0.55),
  },
  overlayTap: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: hexToRgba(Colors.white, 0.2),
    marginBottom: 16,
  },
  title: { color: Colors.text, fontWeight: '700', fontSize: 17 },
  subtitle: { color: Colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  input: {
    height: 80,
    minWidth: 140,
    borderRadius: 14,
    backgroundColor: Colors.cardAlt,
    color: Colors.text,
    fontSize: 40,
    textAlign: 'center',
    fontWeight: '700',
  },
  suffix: { color: Colors.textMuted, fontSize: 16 },
  confirmBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
})