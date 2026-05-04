import { FlatList, RefreshControl, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import type { RivalryMatchItem } from '../../services/rivalry/rivalry.types'
import { RivalryDisciplineChips } from './RivalryDisciplineChips'
import { RivalryHeroCard } from './RivalryHeroCard'
import { RivalryMatchRow } from './RivalryMatchRow'
import { rivalryScreenStyles as styles } from './rivalryScreen.styles'

export type RivalryMatchesListProps = {
  filteredMatches: RivalryMatchItem[]
  refreshing: boolean
  onRefresh: () => Promise<void>
  friendNick: string
  heroStats: { wins: number; losses: number; balance: number; disciplines: number }
  chips: string[]
  selectedDiscipline: string | null
  onSelectDiscipline: (d: string | null) => void
}

export function RivalryMatchesList({
  filteredMatches,
  refreshing,
  onRefresh,
  friendNick,
  heroStats,
  chips,
  selectedDiscipline,
  onSelectDiscipline,
}: RivalryMatchesListProps) {
  return (
    <FlatList
      data={filteredMatches}
      keyExtractor={item => item.betId}
      style={styles.list}
      bounces
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accentLight}
          colors={[Colors.accentLight]}
        />
      }
      ListHeaderComponent={
        <>
          <RivalryHeroCard
            friendNick={friendNick}
            wins={heroStats.wins}
            losses={heroStats.losses}
            balance={heroStats.balance}
            disciplinesCount={heroStats.disciplines}
          />
          <RivalryDisciplineChips
            disciplines={chips}
            selected={selectedDiscipline}
            onSelect={onSelectDiscipline}
          />
          <Text style={styles.sectionLabel}>OSTATNIE MECZE</Text>
        </>
      }
      renderItem={({ item }) => <RivalryMatchRow match={item} onPress={() => {}} />}
      ListEmptyComponent={
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>Brak meczów dla tego filtra.</Text>
        </View>
      }
    />
  )
}
