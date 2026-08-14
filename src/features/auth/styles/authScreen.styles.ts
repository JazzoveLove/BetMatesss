import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

const FIELD_BORDER = 'rgba(232,230,224,0.25)'

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  formContent: { flexGrow: 1, justifyContent: 'flex-start', padding: 24, paddingTop: 12 },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 40, fontWeight: 'bold', color: Colors.accentLight, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', marginBottom: 48 },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: FIELD_BORDER,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  counter: { fontSize: 12, color: Colors.textFaint, textAlign: 'right', marginTop: 6, marginBottom: 32 },
  primaryButton: { backgroundColor: Colors.accent, borderRadius: 26, height: 52, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  secondaryButton: { borderWidth: 1, borderColor: FIELD_BORDER, borderRadius: 26, height: 52, backgroundColor: Colors.cardAlt, justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  disclaimer: { fontSize: 12, color: Colors.textFaint, textAlign: 'center', marginTop: 16, lineHeight: 17 },

  // Welcome screen
  welcomeContent: { flexGrow: 1, padding: 24, justifyContent: 'space-between' },
  welcomeHero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoBox: { width: 84, height: 84, borderRadius: 22, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoBoxText: { color: Colors.white, fontSize: 36, fontWeight: '700' },
  appName: { fontSize: 24, fontWeight: '600', color: Colors.text },
  welcomeActions: { marginBottom: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 },
  footerLink: { fontSize: 12, color: Colors.textFaint },
  footerDivider: { fontSize: 12, color: Colors.textFaint, marginHorizontal: 6 },

  // Back-arrow header used by login/register
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.cardAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  backButtonText: { color: Colors.text, fontSize: 18, fontWeight: '700' },

  // Left-aligned screen title used by login/register
  screenTitle: { fontSize: 26, fontWeight: '500', color: Colors.text, textAlign: 'left', marginBottom: 28 },

  // Field label above an input
  fieldLabel: { fontSize: 13, color: Colors.textMuted, marginBottom: 8 },
  fieldGroup: { marginBottom: 16 },

  // Password field with an inline eye toggle
  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 48 },
  eyeToggle: { position: 'absolute', right: 14, height: '100%', justifyContent: 'center', alignItems: 'center' },

  fieldHint: { fontSize: 12, color: Colors.textFaint, marginTop: -4, marginBottom: 16 },

  mutedLink: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  mutedLinkDisabled: { color: 'rgba(127,119,221,0.45)' },
})