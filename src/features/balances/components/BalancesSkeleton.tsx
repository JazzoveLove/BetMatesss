import { StyleSheet, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'

const ROWS = [0, 1, 2]

/**
 * Statyczny szkielet 3 wierszy (bez animacji) — zajmuje mniej więcej tyle
 * miejsca co realna lista, więc po wczytaniu danych nie ma skoku layoutu.
 */
export function BalancesSkeleton() {
  return (
    <View testID="balances-skeleton">
      {ROWS.map(i => (
        <View key={i} style={styles.row}>
          <View style={styles.avatar} />
          <View style={styles.lines}>
            <View style={styles.lineWide} />
            <View style={styles.lineNarrow} />
          </View>
          <View style={styles.amount} />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.cardAlt },
  lines: { flex: 1, marginLeft: 12, gap: 8 },
  lineWide: { width: '55%', height: 12, borderRadius: 6, backgroundColor: Colors.cardAlt },
  lineNarrow: { width: '32%', height: 10, borderRadius: 5, backgroundColor: Colors.card },
  amount: { width: 52, height: 14, borderRadius: 7, backgroundColor: Colors.cardAlt, marginLeft: 12 },
})
