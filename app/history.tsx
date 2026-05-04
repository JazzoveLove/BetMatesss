import { ActivityIndicator, RefreshControl } from 'react-native'
import { ScrollView, YStack, Text } from 'tamagui'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useHistory } from '../hooks/useHistory'
import { HistoryFilterBar } from '../components/history/HistoryFilterBar'
import { HistoryListItem } from '../components/history/HistoryListItem'
import { HistoryEmptyState } from '../components/history/HistoryEmptyState'

export default function HistoryScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const initialFilter = route.params?.initialFilter === 'active' ? 'active' : 'all'
  const { loading, refreshing, items, filter, setFilter, onRefresh } = useHistory(initialFilter)

  if (loading) {
    return (
      <YStack flex={1} style={{ backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#7F77DD" size="large" />
      </YStack>
    )
  }

  return (
    <ScrollView
      flex={1}
      style={{ backgroundColor: '#0f1117' }}
      contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 40 } as any}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#7F77DD"
          colors={['#7F77DD']}
        />
      }
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#e8e6e0', marginBottom: 6 }}>Historia</Text>
      <Text style={{ fontSize: 13, color: 'rgba(232,230,224,0.5)', marginBottom: 20 }}>
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
