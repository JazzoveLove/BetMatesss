import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { hexToRgba } from '@/shared/utils/colors'

export const styles = StyleSheet.create({
  actionsRow: { marginHorizontal: 16, marginTop: 16, marginBottom: 32, flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionText: { color: Colors.text, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  actionEditText: { color: Colors.accentLight, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  logoutButton: {
    flex: 1,
    backgroundColor: hexToRgba(Colors.red, 0.12),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.red, 0.3),
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: { color: Colors.red, fontSize: 13, fontWeight: '700', textAlign: 'center' },
})
