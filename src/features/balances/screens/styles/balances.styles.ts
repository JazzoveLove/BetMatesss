import { StyleSheet } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  // BEZ flexGrow: 1. Ten kontener to contentContainerStyle zewnętrznego
  // (pionowego) ScrollView. flexGrow: 1 rozciągał kolumnę do pełnej wysokości
  // ekranu; przy krótkiej liście zostawało wolne miejsce w osi głównej, a
  // zagnieżdżony poziomy ScrollView filtrów (BalanceFilterBar), nie mając
  // ograniczonej wysokości, rozlewał się na to miejsce i rozciągał chipy w
  // pionowe słupki. Tło i tak maluje `safe` (flex: 1), więc wizualnie nic nie
  // tracimy; pull-to-refresh działa bez flexGrow.
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backBtn: {
    width: 44,
    height: 44,
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  sectionHeader: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 4,
  },
})
