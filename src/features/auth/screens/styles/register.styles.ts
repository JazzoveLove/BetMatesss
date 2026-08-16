import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { AuthTheme } from '@/shared/constants/authTheme'

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'flex-start', padding: 24, paddingTop: 12 },

  backButton: { width: AuthTheme.backButtonSize, height: AuthTheme.backButtonSize, borderRadius: AuthTheme.backButtonSize / 2, backgroundColor: Colors.cardAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  backButtonText: { color: Colors.text, fontSize: 18, fontWeight: '700' },

  screenTitle: { fontSize: 26, fontWeight: '500', color: Colors.text, textAlign: 'left', marginBottom: 28 },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: Colors.textMuted, marginBottom: 8 },
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

  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 48 },
  eyeToggle: { position: 'absolute', top: 0, bottom: 12, right: 14, justifyContent: 'center', alignItems: 'center' },
  fieldHint: { fontSize: 12, color: Colors.textFaint, marginTop: -4, marginBottom: 16 },

  primaryButton: { backgroundColor: Colors.accent, borderRadius: AuthTheme.pillRadius, height: AuthTheme.buttonHeight, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
})
