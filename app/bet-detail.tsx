import { useState, useCallback } from 'react'
import { StyleSheet, ActivityIndicator, Modal, Pressable, Alert, TouchableOpacity } from 'react-native'
import { View, Text, ScrollView, Input } from 'tamagui'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { useBetDetail } from '../hooks/useBetDetail'
import { GAME_MAP } from '../constants/games'

// ─── Navigation types ─────────────────────────────────────────────────────────

type RootParamList = { BetDetail: { betId: string } }

// ─── Static maps ──────────────────────────────────────────────────────────────

const FORMAT_LABEL: Record<string, string> = {
  single:      'Jeden mecz',
  series:      'Seria meczów',
  round_robin: 'Round robin',
  team:        'Drużynowy',
  session:     'Sesja',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Oczekuje',   color: '#EF9F27', bg: '#EF9F2718' },
  active:    { label: 'Aktywny',    color: '#7F77DD', bg: '#7F77DD18' },
  awaiting_confirmation: { label: 'Do potwierdzenia', color: '#EF9F27', bg: '#EF9F2718' },
  completed: { label: 'Zakończony', color: '#1D9E75', bg: '#1D9E7518' },
  disputed:  { label: 'Spór',       color: '#E24B4A', bg: '#E24B4A18' },
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BetDetailScreen() {
  const route = useRoute<RouteProp<RootParamList, 'BetDetail'>>()
  const navigation = useNavigation<any>()
  const { betId } = route.params

  const [resultModalVisible, setResultModalVisible] = useState(false)
  const [modalScore, setModalScore] = useState('')
  const [modalWinnerId, setModalWinnerId] = useState<string | null>(null)

  const {
    loading, bet, settlements, currentUserId,
    score, setScore, resolving, confirming, disputing, markingPaid, reminding, pendingResult,
    submitResult, confirmResult, disputeResult, markPaid, sendReminder,
  } = useBetDetail(betId)

  const openResultModal = useCallback(() => {
    setModalScore(score.trim() || '')
    setModalWinnerId(null)
    setResultModalVisible(true)
  }, [score])

  const closeResultModal = useCallback(() => {
    setResultModalVisible(false)
    setModalWinnerId(null)
  }, [])

  const onConfirmResultInModal = useCallback(async () => {
    if (!modalScore.trim()) {
      Alert.alert('Brak wyniku', 'Wpisz wynik (np. 5:3).')
      return
    }
    if (!modalWinnerId) {
      Alert.alert('Wybierz zwycięzcę', 'Wskaż, kto wygrał.')
      return
    }
    const ok = await submitResult(modalWinnerId, modalScore)
    if (ok) closeResultModal()
  }, [modalScore, modalWinnerId, submitResult, closeResultModal])

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#7F77DD" size="large" />
      </View>
    )
  }

  if (!bet) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Nie znaleziono zakładu.</Text>
      </View>
    )
  }

  const game = GAME_MAP[bet.gameTemplate] ?? { emoji: '🎲', label: bet.gameTemplate }
  const statusCfg = STATUS_CONFIG[bet.status] ?? STATUS_CONFIG.pending
  const isCompleted = bet.status === 'completed'
  const currentParticipant = bet.participants.find(p => p.id === currentUserId)
  const isCreator = currentParticipant?.role === 'creator'
  const creatorParticipant = bet.participants.find(p => p.role === 'creator')
  const creatorNick = creatorParticipant?.nick ?? 'organizatora'
  const showEnterResultCta = bet.status === 'active' && isCreator
  const showWaitingForOrganizer = bet.status === 'active' && !isCreator
  const canConfirmResult =
    bet.status === 'awaiting_confirmation' &&
    !!pendingResult &&
    !isCreator

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Wstecz</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Zakład</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent as any}
        showsVerticalScrollIndicator={false}
      >
        {/* Game info */}
        <View style={styles.gameCard}>
          <Text style={styles.gameEmoji}>{game.emoji}</Text>
          <View style={styles.gameInfo}>
            <Text style={styles.gameName}>{game.label}</Text>
            <Text style={styles.gameFormat}>{FORMAT_LABEL[bet.format] ?? bet.format}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Participants */}
        <Text style={styles.sectionTitle}>Uczestnicy</Text>
        {bet.participants.map(p => (
          <View key={p.id} style={styles.participantCard}>
            <View style={styles.participantLeft}>
              <View style={[styles.avatar, p.id === currentUserId && styles.avatarMe]}>
                <Text style={styles.avatarText}>{p.nick[0]?.toUpperCase()}</Text>
              </View>
              <View>
                <View style={styles.nickRow}>
                  <Text style={styles.participantNick}>{p.nick}</Text>
                  {p.id === currentUserId && (
                    <View style={styles.youBadge}><Text style={styles.youText}>Ty</Text></View>
                  )}
                </View>
                <Text style={styles.participantRole}>
                  {p.role === 'creator' ? 'Twórca' : 'Uczestnik'}
                  {' · '}
                  {p.confirmed ? '✓ Potwierdził' : '⏳ Oczekuje'}
                </Text>
              </View>
            </View>
            <View style={styles.participantRight}>
              {bet.stakeMode !== 'none' && (
                <Text style={styles.participantStake}>{p.stakeAmount} zł</Text>
              )}
              {p.odds > 0 && (
                <Text style={styles.participantOdds}>× {p.odds.toFixed(2)}</Text>
              )}
            </View>
          </View>
        ))}

        {showEnterResultCta && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rozstrzygnięcie</Text>
            <TouchableOpacity
              style={styles.enterResultBtn}
              onPress={openResultModal}
              activeOpacity={0.85}
            >
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

        {/* Settlements — rekordy z settlements (amount > 0 po stronie serwisu) */}
        {isCompleted && settlements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ROZLICZENIE</Text>
            {settlements.map(s => {
              console.log('[bet-detail ROZLICZENIE] row', {
                id: s.id,
                debtorNick: s.debtorNick,
                creditorNick: s.creditorNick,
                amount: s.amount,
                paid: s.paid,
                debtorId: s.debtorId,
                creditorId: s.creditorId,
                currentUserId,
              })
              return (
              <View key={s.id} style={[styles.settlementCard, s.paid && styles.settlementPaid]}>
                <Text style={styles.settlementLine}>
                  <Text style={styles.settlementName}>{s.debtorNick}</Text>
                  <Text style={styles.settlementOwes}> jest winien </Text>
                  <Text style={styles.settlementName}>{s.creditorNick}</Text>
                  <Text style={styles.settlementOwes}> </Text>
                  <Text style={styles.settlementAmountInLine}>{s.amount} zł</Text>
                </Text>
                {s.paid ? (
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidText}>✓ Zapłacono</Text>
                  </View>
                ) : (
                  <View style={styles.settlementActions}>
                    {s.debtorId === currentUserId && (
                      <TouchableOpacity
                        style={styles.payBtn}
                        onPress={() => {
                          console.log('[bet-detail] Zapłacono pressed', s.id)
                          void markPaid(s.id, s.debtorId)
                        }}
                        disabled={markingPaid === s.id}
                        activeOpacity={0.8}
                      >
                        {markingPaid === s.id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.payBtnText}>Zapłacono</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    {s.creditorId === currentUserId && (
                      <TouchableOpacity
                        style={styles.remindBtn}
                        onPress={() => {
                          console.log('[bet-detail] Przypomnij pressed', s.id)
                          void sendReminder(s)
                        }}
                        disabled={reminding === s.id}
                        activeOpacity={0.8}
                      >
                        {reminding === s.id ? (
                          <ActivityIndicator color="#EF9F27" size="small" />
                        ) : (
                          <Text style={styles.remindBtnText}>Przypomnij</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
              )
            })}
          </View>
        )}

        {isCompleted && settlements.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ROZLICZENIE</Text>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {bet.stakeMode === 'none'
                  ? 'Brak rozliczeń (zakład bez stawki)'
                  : 'Brak wpisów rozliczeniowych — odśwież ekran. Przy ustawionej stawce sprawdź logi: [getSettlements], [createSettlements].'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={resultModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeResultModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeResultModal}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Wpisz wynik</Text>
            <Input
              style={styles.modalScoreInput}
              value={modalScore}
              onChangeText={setModalScore}
              placeholder="np. 5:3"
              placeholderTextColor={'rgba(232,230,224,0.3)' as never}
              autoCapitalize="none"
            />
            <Text style={styles.resolveHint}>Kto wygrał?</Text>
            <View style={styles.resolveButtons}>
              {bet.participants.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.resolveBtn,
                    modalWinnerId === p.id && styles.resolveBtnSelected,
                    p.id === currentUserId && styles.resolveBtnHighlight,
                  ]}
                  onPress={() => setModalWinnerId(p.id)}
                  disabled={resolving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resolveBtnText}>
                    {p.id === currentUserId ? '🏆 Wygrałem' : `${p.nick} wygrał`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={closeResultModal} disabled={resolving}>
                <Text style={styles.modalCancelText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, resolving && styles.modalSubmitDisabled]}
                onPress={() => void onConfirmResultInModal()}
                disabled={resolving}
                activeOpacity={0.85}
              >
                {resolving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Zatwierdź</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f1117' },
  centered: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'rgba(232,230,224,0.5)', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  backBtn: { width: 80 },
  backText: { fontSize: 14, color: '#7F77DD' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#e8e6e0' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  gameCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#181c24', borderRadius: 16, borderWidth: 0.5, borderColor: '#1e2330', padding: 18, marginBottom: 24, gap: 14 },
  gameEmoji: { fontSize: 36 },
  gameInfo: { flex: 1 },
  gameName: { fontSize: 18, fontWeight: '700', color: '#e8e6e0', marginBottom: 4 },
  gameFormat: { fontSize: 13, color: 'rgba(232,230,224,0.5)' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(232,230,224,0.5)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  participantCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#181c24', borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330', padding: 14, marginBottom: 8 },
  participantLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e2330', justifyContent: 'center', alignItems: 'center' },
  avatarMe: { backgroundColor: '#534AB730' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#7F77DD' },
  nickRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  participantNick: { fontSize: 14, fontWeight: '600', color: '#e8e6e0' },
  youBadge: { backgroundColor: '#1e2330', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  youText: { fontSize: 10, color: 'rgba(232,230,224,0.4)' },
  participantRole: { fontSize: 12, color: 'rgba(232,230,224,0.4)' },
  participantRight: { alignItems: 'flex-end', gap: 3 },
  participantStake: { fontSize: 15, fontWeight: '700', color: '#e8e6e0' },
  participantOdds: { fontSize: 12, color: 'rgba(232,230,224,0.4)' },
  scoreRow: { marginBottom: 16 },
  scoreInput: { backgroundColor: '#181c24', borderWidth: 0.5, borderColor: '#1e2330', borderRadius: 12, padding: 14, fontSize: 24, color: '#e8e6e0', textAlign: 'center', letterSpacing: 2 },
  resolveHint: { fontSize: 13, color: 'rgba(232,230,224,0.5)', marginBottom: 10 },
  resolveButtons: { gap: 10 },
  resolveBtn: { backgroundColor: '#181c24', borderWidth: 0.5, borderColor: '#1e2330', borderRadius: 12, padding: 16, alignItems: 'center' },
  resolveBtnPrimary: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  resolveBtnHighlight: { borderColor: '#7F77DD' },
  resolveBtnSelected: { backgroundColor: '#534AB730', borderColor: '#534AB7' },
  disputeBtn: { backgroundColor: '#E24B4A', borderColor: '#E24B4A' },
  resolveBtnText: { fontSize: 15, fontWeight: '600', color: '#e8e6e0' },
  enterResultBtn: { backgroundColor: '#534AB7', borderRadius: 12, padding: 16, alignItems: 'center' },
  enterResultBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  waitingOrganizerCard: { backgroundColor: '#181c24', borderRadius: 12, borderWidth: 0.5, borderColor: '#1e2330', padding: 16 },
  waitingOrganizerText: { fontSize: 14, color: 'rgba(232,230,224,0.65)', lineHeight: 20 },
  waitingOrganizerName: { color: '#e8e6e0', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#181c24', borderRadius: 16, borderWidth: 0.5, borderColor: '#1e2330', padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#e8e6e0', marginBottom: 16 },
  modalScoreInput: { backgroundColor: '#0f1117', borderWidth: 0.5, borderColor: '#1e2330', borderRadius: 12, padding: 14, fontSize: 22, color: '#e8e6e0', textAlign: 'center', letterSpacing: 2, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelBtn: { flex: 1, backgroundColor: '#1e2330', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: 'rgba(232,230,224,0.7)' },
  modalSubmitBtn: { flex: 1, backgroundColor: '#1D9E75', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalSubmitDisabled: { opacity: 0.6 },
  modalSubmitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  pendingResultCard: { backgroundColor: '#181c24', borderRadius: 12, borderWidth: 0.5, borderColor: '#1e2330', padding: 14, gap: 6, marginBottom: 10 },
  pendingResultText: { fontSize: 14, color: 'rgba(232,230,224,0.6)' },
  pendingResultValue: { color: '#e8e6e0', fontWeight: '700' },
  waitingText: { fontSize: 13, color: 'rgba(232,230,224,0.5)' },
  settlementCard: { backgroundColor: '#181c24', borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330', padding: 16, marginBottom: 10, gap: 12 },
  settlementPaid: { opacity: 0.5 },
  settlementLine: { fontSize: 15, lineHeight: 22, color: '#e8e6e0' },
  settlementName: { color: '#e8e6e0', fontWeight: '600' },
  settlementOwes: { color: 'rgba(232,230,224,0.55)', fontWeight: '400' },
  settlementAmountInLine: { fontSize: 15, fontWeight: '700', color: '#E24B4A' },
  paidBadge: { alignSelf: 'flex-start' },
  paidText: { fontSize: 13, color: '#1D9E75', fontWeight: '600' },
  settlementActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  payBtn: { flex: 1, minWidth: 120, backgroundColor: '#534AB7', borderRadius: 10, padding: 12, alignItems: 'center' },
  payBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  remindBtn: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#EF9F2718',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#EF9F27',
  },
  remindBtnText: { color: '#EF9F27', fontSize: 14, fontWeight: '600' },
  emptyCard: { backgroundColor: '#181c24', borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330', padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: 'rgba(232,230,224,0.4)' },
})
