import { StyleSheet } from 'react-native'
import { Colors } from '../../../constants/colors'

export function rgbaFromHex(hexColor: string, alpha: number): string {
  const parsed = hexColor.replace('#', '')
  const num = Number.parseInt(parsed, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r},${g},${b},${alpha})`
}

export const stakeStepStyles = StyleSheet.create({
  sectionLabel: {
    marginLeft: 16,
    marginBottom: 10,
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeCol: { flex: 1 },
  modeCard: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  modeCardSelected: {
    backgroundColor: rgbaFromHex(Colors.accent, 0.2),
    borderColor: Colors.accent,
  },
  modeTitle: { color: Colors.text, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  modeTitleSelected: { color: Colors.accentLight },
  modeDesc: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4 },
  modeDescSelected: { color: Colors.accentLight },
  equalRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  equalLabel: { color: Colors.textMuted, fontSize: 14, flex: 1 },
  equalInput: {
    width: 80,
    backgroundColor: Colors.cardAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  equalSuffix: { color: Colors.textMuted, fontSize: 14 },
  poolAccent: { color: Colors.accentLight, fontSize: 14, fontWeight: '600' },
  inlineError: {
    width: '100%',
    marginTop: 8,
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '600',
  },
  customStakeRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  customStakeLabel: { color: Colors.textMuted, fontSize: 14, flex: 1 },
  customStakeInput: {
    width: 80,
    backgroundColor: Colors.cardAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  customSummary: { marginTop: 12, color: Colors.accentLight, fontSize: 14, fontWeight: '600' },
  summaryCard: {
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  summaryHeader: {
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontWeight: '700',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  summaryLabel: { color: Colors.textMuted, fontSize: 13 },
  summaryValue: { color: Colors.text, fontSize: 14, textAlign: 'right', flex: 1 },
  summaryMuted: { color: Colors.textMuted, fontSize: 14, textAlign: 'right', flex: 1 },
  summaryParticipants: { color: Colors.accentLight, fontSize: 14, fontWeight: '700', textAlign: 'right', flex: 1 },
  summaryDivider: { height: 1, backgroundColor: rgbaFromHex(Colors.text, 0.06), marginVertical: 12 },
})
