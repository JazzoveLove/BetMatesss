import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { AuthTheme } from '@/shared/constants/authTheme'

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 40, fontWeight: 'bold', color: Colors.accentLight, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', marginBottom: 48 },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AuthTheme.fieldBorderColor,
    borderRadius: AuthTheme.fieldRadius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  counter: { fontSize: 12, color: Colors.textFaint, textAlign: 'right', marginTop: 6, marginBottom: 32 },
  primaryButton: { backgroundColor: Colors.accent, borderRadius: AuthTheme.pillRadius, height: AuthTheme.buttonHeight, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  disclaimer: { fontSize: 12, color: Colors.textFaint, textAlign: 'center', marginTop: 16, lineHeight: 17 },
})
