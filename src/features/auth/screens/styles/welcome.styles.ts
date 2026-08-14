import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { AuthTheme } from '@/shared/constants/authTheme'

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  welcomeContent: { flexGrow: 1, padding: 24, justifyContent: 'space-between' },
  welcomeHero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoBox: { width: 84, height: 84, borderRadius: 22, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoBoxText: { color: Colors.white, fontSize: 36, fontWeight: '700' },
  appName: { fontSize: 24, fontWeight: '600', color: Colors.text },
  welcomeActions: { marginBottom: 8 },
  primaryButton: { backgroundColor: Colors.accent, borderRadius: AuthTheme.pillRadius, height: AuthTheme.buttonHeight, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  secondaryButton: { borderWidth: 1, borderColor: AuthTheme.fieldBorderColor, borderRadius: AuthTheme.pillRadius, height: AuthTheme.buttonHeight, backgroundColor: Colors.cardAlt, justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 },
  footerLink: { fontSize: 12, color: Colors.textFaint },
  footerDivider: { fontSize: 12, color: Colors.textFaint, marginHorizontal: 6 },
})
