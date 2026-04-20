import { View, Text, StyleSheet } from 'react-native'

type Props = {
  label: string
  value: string
  highlight?: 'positive' | 'negative' | 'neutral'
}

export default function StatCard({ label, value, highlight = 'neutral' }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          styles.value,
          highlight === 'positive' && styles.positive,
          highlight === 'negative' && styles.negative,
        ]}
      >
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#181c24',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#1e2330',
    padding: 14,
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    color: 'rgba(232,230,224,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 7,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e8e6e0',
  },
  positive: {
    color: '#1D9E75',
  },
  negative: {
    color: '#E24B4A',
  },
})
