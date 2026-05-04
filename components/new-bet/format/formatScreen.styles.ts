import { StyleSheet } from 'react-native'
import { Colors } from '../../../constants/colors'
import { rgbaFromHex } from '../stake/stakeStyles'

export const formatScreenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gameChipWrap: { marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  gameChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  gameChipText: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  gameChipSep: { color: Colors.textMuted, fontSize: 13 },
  gameChipAction: { color: Colors.accentLight, fontSize: 13, fontWeight: '600' },
  sectionLabel: {
    marginHorizontal: 16,
    marginBottom: 8,
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  footerFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -16,
    height: 16,
    backgroundColor: rgbaFromHex(Colors.background, 0.6),
  },
  nextButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  nextMainText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  nextSubText: { color: rgbaFromHex(Colors.text, 0.6), fontSize: 11 },
})
