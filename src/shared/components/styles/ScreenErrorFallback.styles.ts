import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: { color: Colors.textMuted, fontSize: 15, textAlign: 'center' },
  btn: {
    backgroundColor: Colors.cardAlt,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  btnText: { color: Colors.accentLight, fontSize: 14, fontWeight: '600' },
})
