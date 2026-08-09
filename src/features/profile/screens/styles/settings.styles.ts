import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { hexToRgba } from '@/shared/utils/colors'

export const styles = StyleSheet.create({
  safeTop: { flex: 1, backgroundColor: Colors.background },
  safeBottom: { flex: 1, backgroundColor: Colors.background },
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32 },
  header: {
    paddingTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  headerTitle: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
  cardTitle: { color: Colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  cardText: { color: Colors.textMuted, fontSize: 13, lineHeight: 19 },
  linkRow: { paddingVertical: 12 },
  linkText: { color: Colors.accentLight, fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.borderSoft },
  deleteButton: {
    backgroundColor: hexToRgba(Colors.red, 0.12),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.red, 0.3),
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonDisabled: { opacity: 0.5 },
  deleteButtonText: { color: Colors.red, fontSize: 14, fontWeight: '700' },
  version: {
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
    color: Colors.textFaint,
    fontSize: 12,
  },
})
