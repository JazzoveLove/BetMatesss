import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

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
    justifyContent: 'space-between',
  },
  headerTitle: { color: Colors.text, fontSize: 20, fontWeight: '700' },
})
