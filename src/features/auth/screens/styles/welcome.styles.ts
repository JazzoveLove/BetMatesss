import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { AuthTheme } from '@/shared/constants/authTheme'

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  welcomeContent: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  welcomeHero: { flex: 2, alignItems: 'center', justifyContent: 'center' },
  logoBox: { width: 116, height: 116, borderRadius: 28, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoBoxText: { color: Colors.white, fontSize: 50, fontWeight: '700' },
  appName: { fontSize: 24, fontWeight: '600', color: Colors.text },
  welcomeActions: {},
  bottomSpacer: { flex: 1 },
  primaryButton: { backgroundColor: Colors.accent, borderRadius: AuthTheme.pillRadius, height: AuthTheme.buttonHeight, marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  secondaryButton: { borderWidth: 1, borderColor: AuthTheme.fieldBorderColor, borderRadius: AuthTheme.pillRadius, height: AuthTheme.buttonHeight, backgroundColor: Colors.cardAlt, justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 },
  footerLink: { fontSize: 12, color: Colors.textFaint },
  footerDivider: { fontSize: 12, color: Colors.textFaint, marginHorizontal: 6 },
})
