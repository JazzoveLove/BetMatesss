import { YStack, Text } from 'tamagui'

type Props = {
  label: string
  value: string
  highlight?: 'positive' | 'negative' | 'neutral'
}

export default function StatCard({ label, value, highlight = 'neutral' }: Props) {
  const valueColor =
    highlight === 'positive' ? '#1D9E75' : highlight === 'negative' ? '#E24B4A' : '#e8e6e0'

  return (
    <YStack
      flex={1}
      style={{
        backgroundColor: '#181c24',
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: '#1e2330',
        padding: 14,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 10,
          color: 'rgba(232,230,224,0.5)',
          textTransform: 'uppercase',
          letterSpacing: 0.7,
          marginBottom: 7,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: valueColor }}>{value}</Text>
    </YStack>
  )
}
