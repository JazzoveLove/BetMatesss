import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 40, fontWeight: 'bold', color: Colors.accentLight, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', marginBottom: 48 },
  input: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  counter: { fontSize: 12, color: Colors.textFaint, textAlign: 'right', marginTop: 6, marginBottom: 32 },
  primaryButton: { backgroundColor: Colors.accent, borderRadius: 10, height: 52, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  secondaryButton: { borderWidth: 0.5, borderColor: Colors.accent, borderRadius: 10, height: 52, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { color: Colors.accentLight, fontSize: 16 },
  disclaimer: { fontSize: 12, color: Colors.textFaint, textAlign: 'center', marginTop: 16, lineHeight: 17 },
})