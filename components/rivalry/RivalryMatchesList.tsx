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
  paymentSummary: {
    totalPaidByMe: number
    totalPaidByRival: number
    pendingAmount: number
    pendingStatus: 'unpaid' | 'pending_confirmation' | 'clear'
    settledBetsCount: number
  }
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
  paymentSummary,
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
          <Text style={styles.sectionLabel}>ROZLICZENIA</Text>
          <View style={styles.settlementCard}>
            <Text style={styles.settlementText}>Ty zapłaciłeś {friendNick}</Text>
            <Text style={styles.settlementValue}>
              łącznie: {paymentSummary.totalPaidByMe} PLN ({paymentSummary.settledBetsCount} zakładów) ✅
            </Text>
            <Text style={[styles.settlementText, { marginTop: 10 }]}>{friendNick} zapłacił Tobie</Text>
            <Text style={styles.settlementValue}>łącznie: {paymentSummary.totalPaidByRival} PLN</Text>
            <Text style={[styles.settlementText, { marginTop: 10 }]}>
              Aktualnie nierozliczone: {paymentSummary.pendingAmount} PLN
            </Text>
            <Text style={styles.settlementStatus}>
              {paymentSummary.pendingStatus === 'pending_confirmation'
                ? '⏳ Oczekuje na potwierdzenie'
                : paymentSummary.pendingStatus === 'unpaid'
                  ? 'Do zapłaty'
                  : 'Brak zaległości ✅'}
            </Text>
          </View>
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
