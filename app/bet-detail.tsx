import { useState, useCallback, type ComponentType } from 'react'
import { ActivityIndicator, Alert, Modal, Pressable, TouchableOpacity, TextInput } from 'react-native'
import { View, Text, ScrollView } from 'tamagui'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { useBetDetail } from '../hooks/useBetDetail'
import { GAME_MAP, GAME_TEMPLATES } from '../constants/games'
import { Colors } from '../constants/colors'
import type { BetFormat, FormatViewProps } from '../types/bet.types'
import { SingleMatchView } from '../components/bet-detail/SingleMatchView'
import { BestOfView } from '../components/bet-detail/BestOfView'
import { PerMatchView } from '../components/bet-detail/PerMatchView'
import { RoundRobinView } from '../components/bet-detail/RoundRobinView'
import { EliminationView } from '../components/bet-detail/EliminationView'
import { SessionView } from '../components/bet-detail/SessionView'
import { styles } from '../components/bet-detail/betDetailStyles'

type RootParamList = { BetDetail: { betId: string } }

const FORMAT_LABEL: Record<string, string> = {
  single: 'Jeden mecz',
  best_of: 'Best of',
  per_match: 'Zakład za mecz',
  elimination: 'Eliminacje',
  series: 'Seria meczów',
  round_robin: 'Round robin',
  team: 'Drużynowy',
  session: 'Sesja',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Oczekuje', color: Colors.amber, bg: `${Colors.amber}18` },
  active: { label: 'Aktywny', color: Colors.accentLight, bg: `${Colors.accentLight}18` },
  awaiting_confirmation: { label: 'Do potwierdzenia', color: Colors.amber, bg: `${Colors.amber}18` },
  completed: { label: 'Zakończony', color: Colors.green, bg: `${Colors.green}18` },
  disputed: { label: 'Spór', color: Colors.red, bg: `${Colors.red}18` },
}

const FORMAT_VIEWS: Partial<Record<BetFormat, ComponentType<FormatViewProps>>> = {
  single: SingleMatchView,
  best_of: BestOfView,
  per_match: PerMatchView,
  round_robin: RoundRobinView,
  elimination: EliminationView,
  session: SessionView,
}

export default function BetDetailScreen() {
  const route = useRoute<RouteProp<RootParamList, 'BetDetail'>>()
  const navigation = useNavigation<any>()
  const { betId } = route.params

  const [resultModalVisible, setResultModalVisible] = useState(false)
  const [resultModalPerMatch, setResultModalPerMatch] = useState(false)
  const [modalScore, setModalScore] = useState('')
  const [modalWinnerId, setModalWinnerId] = useState<string | null>(null)

  const {
    loading,
    bet,
    settlements,
    currentUserId,
    score,
    resolving,
    confirming,
    disputing,
    markingPaid,
    reminding,
    pendingResult,
    submitResult,
    submitPerMatchResult,
    confirmResult,
    disputeResult,
    markPaid,
    sendReminder,
    acceptBet,
    rejectBet,
    accepting,
    rejecting,
    completeMatchSession,
    completingSession,
  } = useBetDetail(betId)

  const openResultModal = useCallback(() => {
    setModalScore(score.trim() || '')
    setModalWinnerId(null)
    setResultModalPerMatch(false)
    setResultModalVisible(true)
  }, [score])

  const openPerMatchResultModal = useCallback(() => {
    setModalScore('')
    setModalWinnerId(null)
    setResultModalPerMatch(true)
    setResultModalVisible(true)
  }, [])

  const closeResultModal = useCallback(() => {
    setResultModalVisible(false)
    setModalWinnerId(null)
    setResultModalPerMatch(false)
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

  const onConfirmPerMatchInModal = useCallback(async () => {
    if (!modalWinnerId) {
      Alert.alert('Wybierz zwycięzcę', 'Wskaż, kto wygrał mecz.')
      return
    }
    const gameDef = GAME_TEMPLATES.find(g => g.id === bet?.gameTemplate)
    const needScore = gameDef?.resultType !== 'winner_only'
    const ok = await submitPerMatchResult(modalWinnerId, modalScore, needScore)
    if (ok) closeResultModal()
  }, [modalScore, modalWinnerId, submitPerMatchResult, closeResultModal, bet?.gameTemplate])

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.accentLight} size="large" />
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
  const gameTemplateRow = GAME_TEMPLATES.find(g => g.id === bet.gameTemplate)
  const resultType = gameTemplateRow?.resultType ?? 'score'
  const statusCfg = STATUS_CONFIG[bet.status] ?? STATUS_CONFIG.pending
  const isCompleted = bet.status === 'completed'
  const currentParticipant = bet.participants.find(p => p.id === currentUserId)
  const isCreator = currentParticipant?.role === 'creator'
  const isPending = bet.status === 'pending'
  const iAmConfirmed = currentParticipant?.confirmed === true
  const showPendingInviteActions = isPending && !isCreator && !iAmConfirmed && !!currentUserId
  const showPendingWaitingOthers = isPending && !isCreator && iAmConfirmed
  const isPerMatch = bet.format === 'per_match'
  const stakePm = bet.stakePerMatch ?? 0

  const FormatView = FORMAT_VIEWS[bet.format]

  const formatViewProps: FormatViewProps = {
    bet,
    currentUserId,
    settlements,
    resolving,
    confirming,
    disputing,
    markingPaid,
    reminding,
    pendingResult,
    submitResult,
    submitPerMatchResult,
    completeMatchSession,
    confirmResult,
    disputeResult,
    markPaid,
    sendReminder,
    acceptBet,
    rejectBet,
    accepting,
    rejecting,
    completingSession,
    openResultModal,
    openPerMatchResultModal,
  }

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
                    <View style={styles.youBadge}>
                      <Text style={styles.youText}>Ty</Text>
                    </View>
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
              {bet.stakeMode !== 'none' && <Text style={styles.participantStake}>{p.stakeAmount} zł</Text>}
              {p.odds > 0 && <Text style={styles.participantOdds}>× {p.odds.toFixed(2)}</Text>}
            </View>
          </View>
        ))}

        {showPendingInviteActions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zaproszenie</Text>
            <View style={styles.resolveButtons}>
              <TouchableOpacity
                style={[styles.resolveBtn, styles.resolveBtnPrimary]}
                onPress={() => void acceptBet()}
                disabled={accepting}
                activeOpacity={0.85}
              >
                {accepting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.resolveBtnText}>✓ Akceptuj zakład</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resolveBtn, styles.disputeBtn]}
                onPress={async () => {
                  Alert.alert('Odrzucić zaproszenie?', 'Nie będziesz uczestnikiem tego zakładu.', [
                    { text: 'Anuluj', style: 'cancel' },
                    {
                      text: 'Odrzuć',
                      style: 'destructive',
                      onPress: async () => {
                        const ok = await rejectBet()
                        if (ok) navigation.goBack()
                      },
                    },
                  ])
                }}
                disabled={rejecting}
                activeOpacity={0.85}
              >
                {rejecting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.resolveBtnText}>✗ Odrzuć</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showPendingWaitingOthers && (
          <View style={styles.section}>
            <View style={styles.waitingOrganizerCard}>
              <Text style={styles.waitingOrganizerText}>Czekasz na pozostałych uczestników.</Text>
            </View>
          </View>
        )}

        {!FormatView ? (
          <View style={styles.section}>
            <Text style={styles.errorText}>Nieznany format</Text>
          </View>
        ) : (
          <FormatView {...formatViewProps} />
        )}

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
                {isPerMatch && stakePm <= 0
                  ? 'Brak rozliczeń (nie ustawiono stawki za mecz).'
                  : bet.stakeMode === 'none' && !isPerMatch
                    ? 'Brak rozliczeń (zakład bez stawki)'
                    : 'Brak wpisów rozliczeniowych — odśwież ekran. Przy ustawionej stawce sprawdź logi: [getSettlements], [createSettlements].'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={resultModalVisible} animationType="fade" transparent onRequestClose={closeResultModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeResultModal}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {resultModalPerMatch ? 'Wpisz wynik meczu' : 'Wpisz wynik'}
            </Text>
            {!(resultModalPerMatch && resultType === 'winner_only') && (
              <TextInput
                style={{
                  ...styles.modalScoreInput,
                  backgroundColor: Colors.cardAlt,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: Colors.text,
                  fontSize: 16,
                }}
                value={modalScore}
                onChangeText={setModalScore}
                placeholder={resultType === 'legs' ? 'np. 3:2' : 'np. 5:3'}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
              />
            )}
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
                onPress={() => void (resultModalPerMatch ? onConfirmPerMatchInModal() : onConfirmResultInModal())}
                disabled={resolving}
                activeOpacity={0.85}
              >
                {resolving ? (
                  <ActivityIndicator color={Colors.white} size="small" />
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
