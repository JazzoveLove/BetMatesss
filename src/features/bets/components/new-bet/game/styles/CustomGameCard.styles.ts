import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  customCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  customCardSelected: { borderColor: Colors.accent },
  customCardText: { color: Colors.accentLight, fontSize: 14, fontWeight: '600' },
})
