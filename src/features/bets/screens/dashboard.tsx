import { ScrollView, Text } from 'react-native'
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDashboard } from '@/features/bets/hooks/useDashboard'
import { DashboardGreeting } from '@/features/bets/components/dashboard/DashboardGreeting'
import { DashboardStatsRow, DashboardStatsRowSkeleton } from '@/features/bets/components/dashboard/DashboardStatsRow'
import { DashboardActiveBetsSection } from '@/features/bets/components/dashboard/DashboardActiveBetsSection'
import { DashboardRecentResultsSection } from '@/features/bets/components/dashboard/DashboardRecentResultsSection'
import type { RootStackParamList, TabParamList } from '@/navigation/types'
import { styles } from './styles/dashboard.styles'

type DashboardNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavProp>()
  const { loading, user, stats, activeBets, recentMatches } = useDashboard()

  return (
    <SafeAreaView style={styles.safeTop} edges={['top']}>
      <SafeAreaView style={styles.safeBottom} edges={['bottom']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 24 }}
          bounces
          showsVerticalScrollIndicator={false}
        >
          <DashboardGreeting nick={loading ? '...' : user.nick} avatarInitials={loading ? '...' : user.avatarInitials}>
            <Text style={styles.greetingSubtitle}>{activeBets.length} aktywne zakłady</Text>
          </DashboardGreeting>
          {loading ? <DashboardStatsRowSkeleton /> : <DashboardStatsRow stats={stats} />}
          <DashboardActiveBetsSection
            loading={loading}
            activeBets={activeBets}
            onBetPress={id => navigation.navigate('BetDetail', { betId: id })}
            onAvatarPress={friendId => navigation.navigate('FriendDetail', { friendId })}
            onSeeAll={() => navigation.navigate('Historia', { initialFilter: 'active' })}
          />
          <DashboardRecentResultsSection
            loading={loading}
            recentMatches={recentMatches}
            onMatchPress={id => navigation.navigate('BetDetail', { betId: id })}
            onAvatarPress={friendId => navigation.navigate('FriendDetail', { friendId })}
            onSeeAll={() => navigation.navigate('Historia')}
          />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaView>
  )
}
