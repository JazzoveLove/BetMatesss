import { YStack, Text } from 'tamagui'

export function HistoryEmptyState() {
  return (
    <YStack
      style={{
        backgroundColor: '#181c24',
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: '#1e2330',
        padding: 28,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 14, color: 'rgba(232,230,224,0.5)' }}>Brak zakładów w tym widoku</Text>
    </YStack>
  )
}
