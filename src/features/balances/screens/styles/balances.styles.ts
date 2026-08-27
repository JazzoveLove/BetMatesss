import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: { padding: 10, marginLeft: -10 },
  backBtnText: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  title: { color: Colors.text, fontSize: 20, fontWeight: '700' },
})
