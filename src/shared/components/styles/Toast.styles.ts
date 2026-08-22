import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 100,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingVertical: 12,
    paddingHorizontal: 20,
    maxWidth: '100%',
  },
  text: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
})
