import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/shared/constants/colors'
import type { RootStackParamList } from '@/navigation/types'
import { useBalances } from '@/features/balances/hooks/useBalances'
import { BalanceFilterBar } from '@/features/balances/components/BalanceFilterBar'
import { BalanceSummaryCard } from '@/features/balances/components/BalanceSummaryCard'
import { BalanceRowCard } from '@/features/balances/components/BalanceRowCard'
import { BalanceEmptyState } from '@/features/balances/components/BalanceEmptyState'
import { styles } from './styles/balances.styles'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function BalancesScreen() {
  const navigation = useNavigation<Nav>()
  const { loading, refreshing, items, counts, summary, hasAnyFriends, filter, setFilter, onRefresh } = useBalances()

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.accentLight} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentLight} colors={[Colors.accentLight]} />
        }
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.backBtnText}>{'<'}</Text>
          </Pressable>
          <Text style={styles.title}>Bilanse</Text>
        </View>

        <BalanceFilterBar filter={filter} onFilterChange={setFilter} counts={counts} />

        <BalanceSummaryCard summary={summary} />

        {items.length === 0 ? (
          <BalanceEmptyState
            hasAnyFriends={hasAnyFriends}
            onGoToFriends={() => navigation.navigate('Tabs', { screen: 'Znajomi' })}
          />
        ) : (
          items.map(row => (
            <BalanceRowCard
              key={row.id}
              row={row}
              onPress={friendId => navigation.navigate('FriendDetail', { friendId })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
