import { Pressable, Text, View } from 'react-native'
import { RecentMatchCard, type RecentDashboardMatch } from './RecentMatchCard'
import { SkeletonBlock } from './SkeletonBlock'
import { styles } from './styles/DashboardRecentResultsSection.styles'

export type DashboardRecentResultsSectionProps = {
  loading: boolean
  recentMatches: RecentDashboardMatch[]
  onMatchPress: (id: string) => void
  onAvatarPress: (opponentId: string) => void
  onSeeAll: () => void
}

export function DashboardRecentResultsSection({
  loading,
  recentMatches,
  onMatchPress,
  onAvatarPress,
  onSeeAll,
}: DashboardRecentResultsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>OSTATNIE MECZE</Text>
        <Pressable onPress={onSeeAll}>
          <Text style={styles.sectionAction}>{'Zobacz wszystkie ->'}</Text>
        </Pressable>
      </View>
      <View style={styles.cardsColumn}>
        {(loading ? [1, 2, 3] : recentMatches.slice(0, 3)).map(item =>
          typeof item === 'number' ? (
            <View key={item} style={styles.loadingCardNoBorder}>
              <SkeletonBlock width={40} height={40} radius={20} />
              <View style={{ flex: 1, gap: 8 }}>
                <SkeletonBlock width="76%" height={16} radius={6} />
                <SkeletonBlock width="56%" height={12} radius={6} />
              </View>
              <SkeletonBlock width={72} height={30} radius={20} />
            </View>
          ) : (
            <RecentMatchCard
              key={item.id}
              item={item}
              onPress={() => onMatchPress(item.id)}
              onAvatarPress={() => onAvatarPress(item.opponentId)}
            />
          ),
        )}
      </View>
    </View>
  )
}
