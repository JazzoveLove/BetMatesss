import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { ActiveBetCard, type ActiveDashboardBet } from './ActiveBetCard'
import { SkeletonBlock } from './SkeletonBlock'

export type DashboardActiveBetsSectionProps = {
  loading: boolean
  activeBets: ActiveDashboardBet[]
  onBetPress: (id: string) => void
  onSeeAll: () => void
}

export function DashboardActiveBetsSection({
  loading,
  activeBets,
  onBetPress,
  onSeeAll,
}: DashboardActiveBetsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>AKTYWNE ZAKŁADY</Text>
        <Pressable onPress={onSeeAll}>
          <Text style={styles.sectionAction}>{'Zobacz wszystkie ->'}</Text>
        </Pressable>
      </View>
      <View style={styles.cardsColumn}>
        {(loading ? [1, 2, 3] : activeBets.slice(0, 3)).map(item =>
          typeof item === 'number' ? (
            <View key={item} style={styles.loadingCard}>
              <SkeletonBlock width={40} height={40} radius={20} />
              <View style={{ flex: 1, gap: 8 }}>
                <SkeletonBlock width="76%" height={16} radius={6} />
                <SkeletonBlock width="56%" height={12} radius={6} />
              </View>
              <SkeletonBlock width={72} height={30} radius={8} />
            </View>
          ) : (
            <ActiveBetCard key={item.id} item={item} onPress={() => onBetPress(item.id)} />
          ),
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  sectionAction: { color: Colors.accentLight, fontSize: 13, fontWeight: '500' },
  cardsColumn: { gap: 12 },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 12,
  },
})
