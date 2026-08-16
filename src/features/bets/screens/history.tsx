import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useHistory } from '@/features/bets/hooks/useHistory'
import { HistoryFilterBar } from '@/features/bets/components/history/HistoryFilterBar'
import { HistoryListItem } from '@/features/bets/components/history/HistoryListItem'
import { HistoryEmptyState } from '@/features/bets/components/history/HistoryEmptyState'
import { Colors } from '@/shared/constants/colors'
import { styles } from './styles/history.styles'

type HistoryStackParamList = {
  Historia: { initialFilter?: 'active' | 'all' } | undefined
}
type HistoryNavProp = NativeStackNavigationProp<
  HistoryStackParamList & { BetDetail: { betId: string } }
>
type HistoryRouteProp = RouteProp<HistoryStackParamList, 'Historia'>

export default function HistoryScreen() {
  const navigation = useNavigation<HistoryNavProp>()
  const route = useRoute<HistoryRouteProp>()
  const initialFilter = route.params?.initialFilter === 'active' ? 'active' : 'all'
  const { loading, refreshing, items, filter, setFilter, onRefresh } = useHistory(initialFilter)

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accentLight} size="large" />
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accentLight}
          colors={[Colors.accentLight]}
        />
      }
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 6 }}>Historia</Text>
      <Text style={{ fontSize: 13, color: Colors.textMuted, marginBottom: 20 }}>
        Wszystkie zakłady, w których bierzesz udział
      </Text>

      <HistoryFilterBar filter={filter} onFilterChange={setFilter} />

      {items.length === 0 ? (
        <HistoryEmptyState />
      ) : (
        items.map(item => (
          <HistoryListItem
            key={item.id}
            item={item}
            onPress={betId => navigation.navigate('BetDetail', { betId })}
          />
        ))
      )}
    </ScrollView>
  )
}
