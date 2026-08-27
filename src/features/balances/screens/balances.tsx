import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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
import { BalancesSkeleton } from '@/features/balances/components/BalancesSkeleton'
import { BalancesErrorState } from '@/features/balances/components/BalancesErrorState'
import { BalancesAllSettledNote } from '@/features/balances/components/BalancesAllSettledNote'
import { styles } from './styles/balances.styles'

type Nav = NativeStackNavigationProp<RootStackParamList>

const BACK_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 }

export default function BalancesScreen() {
  const navigation = useNavigation<Nav>()
  const { loading, refreshing, isError, items, counts, summary, hasAnyFriends, filter, setFilter, onRefresh } =
    useBalances()

  const goToFriends = () => navigation.navigate('Tabs', { screen: 'Znajomi' })
  // STAN B vs STAN C: liczy się, czy jest jakiekolwiek NIEZEROWE saldo —
  // nie suma (netSum), bo +50 i −50 też daje 0.
  const hasNonZeroBalance = counts.positive > 0 || counts.negative > 0

  function renderBody() {
    if (loading) return <BalancesSkeleton />
    if (isError) return <BalancesErrorState onRetry={onRefresh} />

    // STAN A — brak jakichkolwiek znajomych: bez filtrów, bez karty RAZEM.
    if (!hasAnyFriends) return <BalanceEmptyState variant="noFriends" onGoToFriends={goToFriends} />

    // STAN B — są znajomi, ale wszystkie salda === 0: karta RAZEM zostaje
    // (zero to tu prawdziwa informacja), filtrów nie ma czego filtrować.
    if (!hasNonZeroBalance) {
      return (
        <>
          <BalanceSummaryCard summary={summary} allSettled />
          <BalancesAllSettledNote friendCount={counts.all} />
        </>
      )
    }

    // STAN C — są niezerowe salda.
    return (
      <>
        <BalanceFilterBar filter={filter} onFilterChange={setFilter} counts={counts} />
        <BalanceSummaryCard summary={summary} />
        {items.length === 0 ? (
          <BalanceEmptyState variant="filterEmpty" onGoToFriends={goToFriends} />
        ) : (
          items.map((row, index) => (
            <BalanceRowCard
              key={row.id}
              row={row}
              isLast={index === items.length - 1}
              onPress={friendId => navigation.navigate('FriendDetail', { friendId })}
            />
          ))
        )}
      </>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
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
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={BACK_HIT_SLOP}
            testID="balances-back"
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Bilanse</Text>
        </View>

        {renderBody()}
      </ScrollView>
    </SafeAreaView>
  )
}
