import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  skeleton: { width: '100%', borderRadius: 12, backgroundColor: Colors.cardAlt },
  avatarSection: { alignItems: 'center', marginTop: 20, marginBottom: 16 },
  statsRow: { marginHorizontal: 16, flexDirection: 'row', gap: 8 },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
})
