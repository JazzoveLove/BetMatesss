import { TouchableOpacity, StyleSheet, ActivityIndicator, Share, Modal, Alert, Image } from 'react-native'
import { View, Text, ScrollView, Input } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { useMemo, useState } from 'react'
import { useNewBet } from '../hooks/useNewBet'
import { GAME_TEMPLATES } from '../constants/games'
import QRCode from 'react-native-qrcode-svg'
import { buildBetInviteUrl } from '../lib/bet-invite-url'

// ─── Static data ──────────────────────────────────────────────────────────────

const GAMES = GAME_TEMPLATES.map(game => ({
  key: game.id,
  emoji: game.emoji,
  label: game.name,
}))

const FORMATS = [
  { key: 'single',      label: 'Jeden mecz',   desc: 'Jeden wynik rozstrzyga zakład.' },
  { key: 'series',      label: 'Seria meczów', desc: 'Kilka meczów — wygrywa kto ma więcej punktów.' },
  { key: 'round_robin', label: 'Round robin',  desc: 'Każdy gra z każdym, ranking po wszystkich.' },
  { key: 'team',        label: 'Drużynowy',    desc: 'Zespoły 2v2 lub 3v3.' },
  { key: 'session',     label: 'Sesja',        desc: 'Kilka dyscyplin w jednym wieczorze.' },
]

const STAKE_MODES = [
  { key: 'equal',  emoji: '⚖️', label: 'Równe',      desc: 'Wszyscy wrzucają tę samą kwotę.' },
  { key: 'custom', emoji: '📊', label: 'Własny kurs', desc: 'Każdy stawia inną kwotę, kurs się wylicza.' },
  { key: 'pick',   emoji: '🎯', label: 'Typowanie',   desc: 'Każdy typuje zwycięzcę. Pula dla trafiających.' },
  { key: 'none',   emoji: '🏆', label: 'Bez stawki',  desc: 'Tylko statystyki, zero kasy.' },
]

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NewBetScreen() {
  const navigation = useNavigation<any>()
  const [inviteActionsOpen, setInviteActionsOpen] = useState(false)
  const [qrVisible, setQrVisible] = useState(false)
  const [friendsModalVisible, setFriendsModalVisible] = useState(false)
  const [invitingFriendId, setInvitingFriendId] = useState<string | null>(null)

  const {
    step, setStep,
    selectedGame, setSelectedGame,
    selectedFormat, setSelectedFormat,
    stakeMode, setStakeMode,
    globalStake, setGlobalStake,
    participants, currentUser,
    friends, friendsLoading,
    removeParticipant, setCustomStake,
    totalPool,
    canProceedStep1, canProceedStep2, canCreate,
    saving, createdBetId, ensureBetCreated, inviteFriendToBet, handleCreate,
  } = useNewBet((betId) => navigation.navigate('BetDetail', { betId }))

  const invitePreviewCode = useMemo(() => {
    return createdBetId || 'kod-zaproszenia'
  }, [createdBetId])
  const invitePreviewLink = useMemo(() => buildBetInviteUrl(invitePreviewCode), [invitePreviewCode])

  async function handleShareInviteLink() {
    const ensuredBetId = await ensureBetCreated()
    if (!ensuredBetId) return
    const link = buildBetInviteUrl(ensuredBetId)
    try {
      await Share.share({
        message: link,
        url: link,
        title: 'Zaproszenie do zakładu',
      })
    } finally {
      setInviteActionsOpen(false)
    }
  }

  async function handleInviteFromFriends(friend: { id: string; nick: string; avatar_url?: string | null }) {
    setInvitingFriendId(friend.id)
    const result = await inviteFriendToBet(friend)
    setInvitingFriendId(null)
    if (result.error) {
      Alert.alert('Błąd', result.error)
      return
    }
    Alert.alert('Zaproszono', `${friend.nick} został dodany do uczestników i dostał zaproszenie.`)
  }

  // ─── Step 1 ──────────────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <View>
        <Text style={styles.stepTitle}>Wybierz grę</Text>
        <View style={styles.grid}>
          {GAMES.map(game => (
            <TouchableOpacity
              key={game.key}
              style={[styles.gameTile, selectedGame === game.key && styles.gameTileActive]}
              onPress={() => setSelectedGame(game.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.gameEmoji}>{game.emoji}</Text>
              <Text style={[styles.gameLabel, selectedGame === game.key && styles.gameLabelActive]}>
                {game.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  // ─── Step 2 ──────────────────────────────────────────────────────────────────

  function renderStep2() {
    return (
      <View>
        <Text style={styles.stepTitle}>Format rozgrywki</Text>
        {FORMATS.map(fmt => (
          <TouchableOpacity
            key={fmt.key}
            style={[styles.formatRow, selectedFormat === fmt.key && styles.formatRowActive]}
            onPress={() => setSelectedFormat(fmt.key)}
            activeOpacity={0.75}
          >
            <View style={[styles.formatRadio, selectedFormat === fmt.key && styles.formatRadioActive]}>
              {selectedFormat === fmt.key && <View style={styles.formatRadioDot} />}
            </View>
            <View style={styles.formatText}>
              <Text style={[styles.formatLabel, selectedFormat === fmt.key && styles.formatLabelActive]}>
                {fmt.label}
              </Text>
              <Text style={styles.formatDesc}>{fmt.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  // ─── Step 3 ──────────────────────────────────────────────────────────────────

  function renderStep3() {
    const needsGlobalStake = stakeMode === 'equal' || stakeMode === 'pick'

    return (
      <View>
        <Text style={styles.stepTitle}>Stawki i uczestnicy</Text>

        <Text style={styles.fieldLabel}>Tryb stawek</Text>
        <View style={styles.stakeModeGrid}>
          {STAKE_MODES.map(mode => (
            <TouchableOpacity
              key={mode.key}
              style={[styles.stakeModeBtn, stakeMode === mode.key && styles.stakeModeBtnActive]}
              onPress={() => setStakeMode(mode.key as any)}
              activeOpacity={0.75}
            >
              <Text style={styles.stakeModeEmoji}>{mode.emoji}</Text>
              <Text style={[styles.stakeModeLabel, stakeMode === mode.key && styles.stakeModeLabelActive]}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.stakeModeDesc}>
          {STAKE_MODES.find(m => m.key === stakeMode)?.desc}
        </Text>

        {needsGlobalStake && (
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Stawka za osobę (zł)</Text>
            <Input
              style={styles.input}
              value={globalStake}
              onChangeText={setGlobalStake}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={'rgba(232,230,224,0.3)' as never}
            />
          </View>
        )}

        <Text style={styles.fieldLabel}>Uczestnicy ({participants.length})</Text>
        {participants.map(p => (
          <View key={p.id} style={styles.participantRow}>
            <View style={styles.participantLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{p.nick[0]?.toUpperCase()}</Text>
              </View>
              <Text style={styles.participantNick}>{p.nick}</Text>
              {p.id === currentUser?.id && (
                <View style={styles.youBadge}><Text style={styles.youText}>Ty</Text></View>
              )}
            </View>
            <View style={styles.participantRight}>
              {stakeMode === 'custom' && (
                <Input
                  style={styles.customStakeInput}
                  value={p.customStake}
                  onChangeText={v => setCustomStake(p.id, v)}
                  keyboardType="numeric"
                  placeholder="zł"
                  placeholderTextColor={'rgba(232,230,224,0.3)' as never}
                />
              )}
              {p.id !== currentUser?.id && (
                <TouchableOpacity onPress={() => removeParticipant(p.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {stakeMode === 'custom' && participants.some(p => Number(p.customStake) > 0) && (
          <View style={styles.oddsPreview}>
            <Text style={styles.oddsPreviewTitle}>Obliczone kursy</Text>
            {participants.map(p => {
              const stake = Number(p.customStake) || 0
              const odds = stake > 0 && totalPool > 0
                ? Math.round((totalPool / stake) * 100) / 100
                : null
              return (
                <View key={p.id} style={styles.oddsRow}>
                  <Text style={styles.oddsNick}>{p.nick}</Text>
                  <View style={styles.oddsRight}>
                    <Text style={styles.oddsStake}>{stake > 0 ? `${stake} zł` : '—'}</Text>
                    <Text style={styles.oddsValue}>{odds !== null ? `× ${odds.toFixed(2)}` : '—'}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Zaproszenia</Text>
          <TouchableOpacity
            style={styles.inviteBtn}
            onPress={() => setInviteActionsOpen(prev => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.inviteBtnText}>Zaproś uczestnika</Text>
          </TouchableOpacity>
          {inviteActionsOpen && (
            <View style={styles.inviteActions}>
              <TouchableOpacity style={styles.inviteActionItem} onPress={handleShareInviteLink} activeOpacity={0.8}>
                <Text style={styles.inviteActionText}>Wyślij link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inviteActionItem}
                onPress={async () => {
                  const ensuredBetId = await ensureBetCreated()
                  if (!ensuredBetId) return
                  setInviteActionsOpen(false)
                  setQrVisible(true)
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.inviteActionText}>Pokaż QR kod</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inviteActionItem, styles.inviteActionItemLast]}
                onPress={() => {
                  setInviteActionsOpen(false)
                  setFriendsModalVisible(true)
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.inviteActionText}>Z listy znajomych</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {totalPool > 0 && stakeMode !== 'none' && (
          <View style={styles.poolPreview}>
            <Text style={styles.poolLabel}>Łączna pula</Text>
            <Text style={styles.poolValue}>{totalPool} zł</Text>
          </View>
        )}
      </View>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : undefined}
          disabled={step === 1}
        >
          <Text style={[styles.backBtnText, step === 1 && styles.backBtnHidden]}>← Wstecz</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nowy zakład</Text>
        <Text style={styles.stepIndicator}>{step} / 3</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent as any}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      <View style={styles.footer}>
        {step < 3 ? (
          <TouchableOpacity
            style={[styles.ctaBtn, !(step === 1 ? canProceedStep1 : canProceedStep2) && styles.ctaBtnDisabled]}
            onPress={() => setStep((step + 1) as 2 | 3)}
            disabled={!(step === 1 ? canProceedStep1 : canProceedStep2)}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaBtnText}>Dalej →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ctaBtn, (!canCreate || saving) && styles.ctaBtnDisabled]}
            onPress={handleCreate}
            disabled={!canCreate || saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaBtnText}>Utwórz zakład 🎲</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={qrVisible} transparent animationType="fade" onRequestClose={() => setQrVisible(false)}>
        <View style={styles.qrModalBackdrop}>
          <View style={styles.qrModalCard}>
            <Text style={styles.qrTitle}>Kod zaproszenia</Text>
            <QRCode value={invitePreviewLink} size={210} backgroundColor="transparent" color="#e8e6e0" />
            <Text style={styles.qrHint}>Znajomy może zeskanować kod lub otworzyć link:</Text>
            <Text style={styles.qrLink}>{invitePreviewLink}</Text>
            <TouchableOpacity style={styles.qrCloseBtn} onPress={() => setQrVisible(false)} activeOpacity={0.8}>
              <Text style={styles.qrCloseBtnText}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={friendsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFriendsModalVisible(false)}
      >
        <View style={styles.qrModalBackdrop}>
          <View style={[styles.qrModalCard, styles.friendsModalCard]}>
            <Text style={styles.qrTitle}>Wybierz znajomego</Text>
            {friendsLoading ? (
              <ActivityIndicator color="#7F77DD" />
            ) : friends.length === 0 ? (
              <Text style={styles.qrHint}>Brak zaakceptowanych znajomych.</Text>
            ) : (
              <ScrollView style={styles.friendsList} contentContainerStyle={styles.friendsListContent as any}>
                {friends.map(friend => {
                  const isAlreadyParticipant = participants.some(p => p.id === friend.id)
                  const isInviting = invitingFriendId === friend.id
                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={[styles.friendPickRow, isAlreadyParticipant && styles.friendPickRowDisabled]}
                      disabled={isAlreadyParticipant || !!isInviting}
                      onPress={() => void handleInviteFromFriends(friend)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.friendPickLeft}>
                        {friend.avatar_url ? (
                          <Image source={{ uri: friend.avatar_url }} style={styles.friendPickAvatar} />
                        ) : (
                          <View style={styles.friendPickAvatarFallback}>
                            <Text style={styles.friendPickAvatarFallbackText}>
                              {friend.nick[0]?.toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.friendPickNick}>{friend.nick}</Text>
                      </View>
                      {isAlreadyParticipant ? (
                        <Text style={styles.friendPickStatus}>Dodany</Text>
                      ) : isInviting ? (
                        <ActivityIndicator size="small" color="#7F77DD" />
                      ) : (
                        <Text style={styles.friendPickStatus}>Zaproś</Text>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.qrCloseBtn} onPress={() => setFriendsModalVisible(false)} activeOpacity={0.8}>
              <Text style={styles.qrCloseBtnText}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f1117' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#e8e6e0' },
  backBtn: { width: 80 },
  backBtnText: { fontSize: 14, color: '#7F77DD' },
  backBtnHidden: { opacity: 0 },
  stepIndicator: { width: 80, textAlign: 'right', fontSize: 13, color: 'rgba(232,230,224,0.4)' },
  progressBar: { height: 2, backgroundColor: '#1e2330', marginHorizontal: 20, borderRadius: 2, marginBottom: 24 },
  progressFill: { height: 2, backgroundColor: '#534AB7', borderRadius: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: '#e8e6e0', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gameTile: { width: '47%', backgroundColor: '#181c24', borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330', padding: 18, alignItems: 'center', gap: 8 },
  gameTileActive: { borderColor: '#534AB7', backgroundColor: '#534AB715' },
  gameEmoji: { fontSize: 32 },
  gameLabel: { fontSize: 13, fontWeight: '500', color: 'rgba(232,230,224,0.6)', textAlign: 'center' },
  gameLabelActive: { color: '#e8e6e0' },
  formatRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#181c24', borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330', padding: 16, marginBottom: 10, gap: 14 },
  formatRowActive: { borderColor: '#534AB7', backgroundColor: '#534AB710' },
  formatRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
  formatRadioActive: { borderColor: '#534AB7' },
  formatRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#534AB7' },
  formatText: { flex: 1 },
  formatLabel: { fontSize: 15, fontWeight: '600', color: 'rgba(232,230,224,0.6)', marginBottom: 3 },
  formatLabelActive: { color: '#e8e6e0' },
  formatDesc: { fontSize: 12, color: 'rgba(232,230,224,0.4)', lineHeight: 17 },
  fieldBlock: { marginTop: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(232,230,224,0.5)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, marginTop: 20 },
  input: { backgroundColor: '#181c24', borderWidth: 0.5, borderColor: '#1e2330', borderRadius: 12, padding: 14, fontSize: 16, color: '#e8e6e0' },
  stakeModeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stakeModeBtn: { width: '47%', backgroundColor: '#181c24', borderRadius: 12, borderWidth: 0.5, borderColor: '#1e2330', padding: 14, alignItems: 'center', gap: 6 },
  stakeModeBtnActive: { borderColor: '#534AB7', backgroundColor: '#534AB715' },
  stakeModeEmoji: { fontSize: 22 },
  stakeModeLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(232,230,224,0.5)' },
  stakeModeLabelActive: { color: '#e8e6e0' },
  stakeModeDesc: { fontSize: 12, color: 'rgba(232,230,224,0.4)', marginTop: 8, lineHeight: 17 },
  participantRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#181c24', borderRadius: 12, borderWidth: 0.5, borderColor: '#1e2330', padding: 12, marginBottom: 8 },
  participantLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#534AB730', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#7F77DD' },
  participantNick: { fontSize: 14, fontWeight: '600', color: '#e8e6e0' },
  youBadge: { backgroundColor: '#1e2330', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  youText: { fontSize: 11, color: 'rgba(232,230,224,0.4)' },
  participantRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customStakeInput: { backgroundColor: '#1e2330', borderRadius: 8, padding: 8, width: 72, fontSize: 14, color: '#e8e6e0', textAlign: 'center' },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E24B4A18', justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: '#E24B4A', fontSize: 12, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1 },
  searchSpinner: { marginLeft: 10 },
  searchResult: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#181c24', borderRadius: 10, padding: 12, marginTop: 6, borderWidth: 0.5, borderColor: '#1e2330' },
  searchResultNick: { fontSize: 14, color: '#e8e6e0', fontWeight: '500' },
  searchResultAdd: { fontSize: 13, color: '#7F77DD', fontWeight: '600' },
  inviteBtn: {
    backgroundColor: '#534AB7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  inviteBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
  inviteActions: {
    marginTop: 10,
    backgroundColor: '#181c24',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#1e2330',
    overflow: 'hidden',
  },
  inviteActionItem: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e2330',
  },
  inviteActionItemLast: { borderBottomWidth: 0 },
  inviteActionText: { fontSize: 14, color: '#e8e6e0', fontWeight: '600' },
  qrModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,17,23,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#181c24',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#1e2330',
    alignItems: 'center',
    padding: 20,
    gap: 14,
  },
  qrTitle: { fontSize: 18, color: '#e8e6e0', fontWeight: '700' },
  qrHint: { fontSize: 12, color: 'rgba(232,230,224,0.5)', textAlign: 'center' },
  qrLink: { fontSize: 12, color: '#7F77DD', textAlign: 'center' },
  qrCloseBtn: {
    marginTop: 4,
    backgroundColor: '#534AB7',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  qrCloseBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  friendsModalCard: {
    maxHeight: '75%',
    alignItems: 'stretch',
  },
  friendsList: { maxHeight: 300, width: '100%' },
  friendsListContent: { gap: 8 },
  friendPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e2330',
    borderWidth: 0.5,
    borderColor: '#1e2330',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  friendPickLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  friendPickAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e2330' },
  friendPickAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#534AB730',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendPickAvatarFallbackText: { color: '#7F77DD', fontWeight: '700', fontSize: 13 },
  friendPickRowDisabled: { opacity: 0.5 },
  friendPickNick: { fontSize: 14, fontWeight: '600', color: '#e8e6e0' },
  friendPickStatus: { fontSize: 13, fontWeight: '700', color: '#7F77DD' },
  poolPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1D9E7515', borderWidth: 0.5, borderColor: '#1D9E75', borderRadius: 12, padding: 16, marginTop: 20 },
  poolLabel: { fontSize: 13, color: '#1D9E75', fontWeight: '600' },
  poolValue: { fontSize: 20, fontWeight: '700', color: '#1D9E75' },
  oddsPreview: { backgroundColor: '#181c24', borderRadius: 12, borderWidth: 0.5, borderColor: '#1e2330', padding: 14, marginTop: 12, gap: 10 },
  oddsPreviewTitle: { fontSize: 11, fontWeight: '600', color: 'rgba(232,230,224,0.4)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  oddsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  oddsNick: { fontSize: 13, color: 'rgba(232,230,224,0.7)', flex: 1 },
  oddsRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  oddsStake: { fontSize: 13, color: 'rgba(232,230,224,0.4)', minWidth: 48, textAlign: 'right' },
  oddsValue: { fontSize: 15, fontWeight: '700', color: '#7F77DD', minWidth: 56, textAlign: 'right' },
  footer: { padding: 20, paddingBottom: 32, borderTopWidth: 0.5, borderTopColor: '#1e2330' },
  ctaBtn: { backgroundColor: '#534AB7', borderRadius: 14, padding: 18, alignItems: 'center' },
  ctaBtnDisabled: { opacity: 0.35 },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
