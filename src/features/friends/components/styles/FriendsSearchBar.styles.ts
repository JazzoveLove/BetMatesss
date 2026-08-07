import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  searchWrap: { overflow: 'hidden', marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  searchInner: {
    height: 44,
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIcon: { color: Colors.textMuted, fontSize: 14 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 0 },
})
