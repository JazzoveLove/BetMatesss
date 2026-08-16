import { Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export function HistoryEmptyState() {
  return (
    <View
      style={{
        backgroundColor: Colors.card,
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: Colors.border,
        padding: 28,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 14, color: Colors.textMuted }}>Brak zakładów w tym widoku</Text>
    </View>
  )
}
