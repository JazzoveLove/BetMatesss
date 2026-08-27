import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 20,
    marginBottom: 20,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: Colors.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '600' },
  value: { fontSize: 32, fontWeight: '700' },
  subtitle: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  emptyText: { color: Colors.textMuted, fontSize: 14, paddingVertical: 4 },
})
