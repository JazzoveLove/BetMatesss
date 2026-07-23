import { StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
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
  primaryButton: { backgroundColor: Colors.accent, borderRadius: 10, height: 52, marginBottom: 12 },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  secondaryButton: { borderWidth: 0.5, borderColor: Colors.accent, borderRadius: 10, height: 52, backgroundColor: 'transparent' },
  secondaryButtonText: { color: Colors.accentLight, fontSize: 16 },
})