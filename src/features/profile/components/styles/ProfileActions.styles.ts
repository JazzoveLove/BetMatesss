import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  actionsWrap: { marginHorizontal: 16, marginTop: 16, marginBottom: 32 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  balancesButton: { marginTop: 8 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionText: { color: Colors.text, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  actionEditText: { color: Colors.accentLight, fontSize: 13, fontWeight: '700', textAlign: 'center' },
})
