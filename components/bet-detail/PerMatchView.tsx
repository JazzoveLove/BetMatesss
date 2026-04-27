import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native'
import { Colors } from '../../constants/colors'
import type { BetParticipant, BetResult, FormatViewProps } from '../../types/bet.types'
import { calculatePerMatchBalance } from '../../utils/formats'
import { formatBalance } from '../../utils/settlements'
import { styles } from './betDetailStyles'

function MatchList({
  results,
  participants,
  stakePerMatch,
}: {
  results: BetResult[]
  participants: BetParticipant[]
  stakePerMatch: number
}) {
  const confirmed = results.filter(r => r.confirmed)
  if (confirmed.length === 0) {
    return (
      <View style={styles.waitingOrganizerCard}>
        <Text style={styles.waitingOrganizerText}>Jeszcze brak rozegranych meczów.</Text>
      </View>
    )
  }
  return (
    <>
      {confirmed.map(r => {
        const winnerNick = participants.find(p => p.id === r.winner_id)?.nick ?? '—'
        const scoreLabel = String(r.scores?.score ?? '—')
        const delta = stakePerMatch > 0 ? stakePerMatch : 0
        return (
          <View key={r.id} style={styles.matchRow}>
            <Text style={styles.matchRowText}>
              Mecz {r.match_number}: {scoreLabel} → {winnerNick}
              {delta > 0 ? ` +${delta} zł` : ''}
            </Text>
          </View>
        )
      })}
    </>
  )
}

export function PerMatchView({
  bet,
  currentUserId,
  resolving,
  completingSession,
  openPerMatchResultModal,
  completeMatchSession,
}: FormatViewProps) {
  const isBetCreator = bet.creatorId === currentUserId
  const creatorParticipant = bet.participants.find(p => p.role === 'creator')
  const creatorNick = creatorParticipant?.nick ?? 'organizatora'
  const stakePm = bet.stakePerMatch ?? 0
  const perMatchBalances = calculatePerMatchBalance(bet.results, stakePm, bet.participants)
  const isCompleted = bet.status === 'completed'

  const showPerMatchActivePanel = bet.status === 'active'
  const showWaitingPerMatchOrganizer = bet.status === 'active' && !isBetCreator

  return (
    <>
      {showPerMatchActivePanel && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mecze ({stakePm > 0 ? `${stakePm} zł / mecz` : 'bez stawki'})</Text>
          <MatchList results={bet.results} participants={bet.participants} stakePerMatch={stakePm} />
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Bilans</Text>
          {bet.participants.map(p => {
            const bal = perMatchBalances[p.id] ?? 0
            const balColor = bal > 0 ? Colors.green : bal < 0 ? Colors.red : Colors.textMuted
            return (
              <View key={p.id} style={styles.balanceRow}>
                <Text style={styles.balanceNick}>{p.nick}</Text>
                <Text style={[styles.balanceAmount, { color: balColor }]}>{formatBalance(bal)}</Text>
              </View>
            )
          })}
          {isBetCreator && (
            <>
              <TouchableOpacity
                style={[styles.enterResultBtn, { marginTop: 14 }]}
                onPress={openPerMatchResultModal}
                activeOpacity={0.85}
                disabled={resolving}
              >
                <Text style={styles.enterResultBtnText}>+ Wpisz wynik meczu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.endSessionBtn}
                onPress={() => {
                  Alert.alert('Potwierdzenie', 'Czy na pewno chcesz zakończyć?', [
                    { text: 'Anuluj', style: 'cancel' },
                    {
                      text: 'Zakończ',
                      style: 'destructive',
                      onPress: () => void completeMatchSession(),
                    },
                  ])
                }}
                activeOpacity={0.85}
                disabled={completingSession}
              >
                {completingSession ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.endSessionBtnText}>Zakończ sesję meczów</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {showWaitingPerMatchOrganizer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mecze</Text>
          <View style={styles.waitingOrganizerCard}>
            <Text style={styles.waitingOrganizerText}>
              Wyniki wpisuje <Text style={styles.waitingOrganizerName}>{creatorNick}</Text>.
            </Text>
          </View>
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Bilans</Text>
          {bet.participants.map(p => {
            const bal = perMatchBalances[p.id] ?? 0
            const balColor = bal > 0 ? Colors.green : bal < 0 ? Colors.red : Colors.textMuted
            return (
              <View key={p.id} style={styles.balanceRow}>
                <Text style={styles.balanceNick}>{p.nick}</Text>
                <Text style={[styles.balanceAmount, { color: balColor }]}>{formatBalance(bal)}</Text>
              </View>
            )
          })}
        </View>
      )}

      {isCompleted && bet.results.filter(r => r.confirmed).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rozegrane mecze</Text>
          <MatchList results={bet.results} participants={bet.participants} stakePerMatch={stakePm} />
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Bilans końcowy</Text>
          {bet.participants.map(p => {
            const bal = perMatchBalances[p.id] ?? 0
            const balColor = bal > 0 ? Colors.green : bal < 0 ? Colors.red : Colors.textMuted
            return (
              <View key={`fin-${p.id}`} style={styles.balanceRow}>
                <Text style={styles.balanceNick}>{p.nick}</Text>
                <Text style={[styles.balanceAmount, { color: balColor }]}>{formatBalance(bal)}</Text>
              </View>
            )
          })}
        </View>
      )}
    </>
  )
}
