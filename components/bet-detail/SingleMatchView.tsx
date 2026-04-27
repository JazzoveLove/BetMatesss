import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import type { FormatViewProps } from '../../types/bet.types'
import { styles } from './betDetailStyles'

export function SingleMatchView({
  bet,
  currentUserId,
  pendingResult,
  resolving,
  confirming,
  disputing,
  openResultModal,
  confirmResult,
  disputeResult,
}: FormatViewProps) {
  const currentParticipant = bet.participants.find(p => p.id === currentUserId)
  const isCreator = currentParticipant?.role === 'creator'
  const creatorParticipant = bet.participants.find(p => p.role === 'creator')
  const creatorNick = creatorParticipant?.nick ?? 'organizatora'

  const showEnterResultCta = bet.status === 'active' && isCreator
  const showWaitingForOrganizer = bet.status === 'active' && !isCreator
  const canConfirmResult =
    bet.status === 'awaiting_confirmation' && !!pendingResult && !isCreator

  return (
    <>
      {showEnterResultCta && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rozstrzygnięcie</Text>
          <TouchableOpacity style={styles.enterResultBtn} onPress={openResultModal} activeOpacity={0.85}>
            <Text style={styles.enterResultBtnText}>Wpisz wynik</Text>
          </TouchableOpacity>
        </View>
      )}

      {showWaitingForOrganizer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wynik</Text>
          <View style={styles.waitingOrganizerCard}>
            <Text style={styles.waitingOrganizerText}>
              Czekamy na wynik od <Text style={styles.waitingOrganizerName}>{creatorNick}</Text>.
            </Text>
          </View>
        </View>
      )}

      {bet.status === 'awaiting_confirmation' && pendingResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {canConfirmResult ? 'Potwierdź wynik' : 'Oczekiwanie na drugą osobę'}
          </Text>
          <View style={styles.pendingResultCard}>
            <Text style={styles.pendingResultText}>
              Wynik: <Text style={styles.pendingResultValue}>{pendingResult.score || '-'}</Text>
            </Text>
            <Text style={styles.pendingResultText}>
              Zwycięzca:{' '}
              <Text style={styles.pendingResultValue}>
                {bet.participants.find(p => p.id === pendingResult.winnerId)?.nick ?? 'Nieznany'}
              </Text>
            </Text>
          </View>
          {canConfirmResult ? (
            <View style={styles.resolveButtons}>
              <TouchableOpacity
                style={[styles.resolveBtn, styles.resolveBtnPrimary]}
                onPress={confirmResult}
                disabled={confirming}
                activeOpacity={0.8}
              >
                {confirming ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.resolveBtnText}>Potwierdź</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resolveBtn, styles.disputeBtn]}
                onPress={disputeResult}
                disabled={disputing}
                activeOpacity={0.8}
              >
                {disputing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.resolveBtnText}>Zgłoś spór</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.waitingText}>Czekamy na potwierdzenie drugiego uczestnika.</Text>
          )}
        </View>
      )}
    </>
  )
}
