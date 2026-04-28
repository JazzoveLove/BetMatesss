import { useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../constants/colors'
import { BET_FORMATS } from '../../constants/formats'
import type { NewBetHandlers, NewBetState } from '../../hooks/useNewBet'

type Props = {
  state: NewBetState
  handlers: NewBetHandlers
}

type StakeModeCard = {
  id: 'none' | 'equal' | 'custom'
  name: string
  description: string
}

const STAKE_MODES: StakeModeCard[] = [
  { id: 'none', name: 'Bez stawki', description: 'Tylko statystyki' },
  { id: 'equal', name: 'Równe', description: 'Wszyscy po tyle samo' },
  { id: 'custom', name: 'Własny kurs', description: 'Różne kwoty' },
]

const ACTIVITY_LABELS = ['wczoraj', '3 dni temu', 'tydzień temu'] as const

function rgbaFromHex(hexColor: string, alpha: number): string {
  const parsed = hexColor.replace('#', '')
  const num = Number.parseInt(parsed, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r},${g},${b},${alpha})`
}

function initialsFromNick(nick: string): string {
  const parts = nick.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function StepStake({ state, handlers }: Props) {
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const modeScaleRef = useRef<Record<string, Animated.Value>>({})

  const {
    selectedGame,
    selectedFormat,
    stakeMode,
    stakeAmount,
    customStakes,
    currentUser,
    participants,
    friendProfiles,
    loading,
  } = state

  const selectedIds = useMemo(() => new Set(participants.map(p => p.id)), [participants])
  const friendsSorted = useMemo(() => {
    const list = [...friendProfiles]
    list.sort((a, b) => {
      const aSelected = selectedIds.has(a.id) ? 0 : 1
      const bSelected = selectedIds.has(b.id) ? 0 : 1
      return aSelected - bSelected || a.nick.localeCompare(b.nick)
    })
    return list
  }, [friendProfiles, selectedIds])

  const friendsFiltered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return friendsSorted
    return friendsSorted.filter(friend => friend.nick.toLowerCase().includes(q))
  }, [friendsSorted, search])

  const modeScale = (id: string): Animated.Value => {
    if (!modeScaleRef.current[id]) modeScaleRef.current[id] = new Animated.Value(1)
    return modeScaleRef.current[id]
  }

  const onModePress = (mode: 'none' | 'equal' | 'custom') => {
    const scale = modeScale(mode)
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 50, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start(() => handlers.setStakeMode(mode))
  }

  const totalPlayers = participants.length + 1
  const equalPool = useMemo(() => (Number(stakeAmount) || 0) * totalPlayers, [stakeAmount, totalPlayers])
  const myCustomStake = Number(customStakes[currentUser?.id ?? ''] ?? 0)
  const customPool = useMemo(() => {
    const selectedSum = participants.reduce((sum, p) => sum + Number(customStakes[p.id] ?? 0), 0)
    return selectedSum + myCustomStake
  }, [customStakes, myCustomStake, participants])
  const myOdds = myCustomStake > 0 ? customPool / myCustomStake : 0

  const formatMeta = BET_FORMATS.find(item => item.id === selectedFormat)
  const canSubmit = participants.length > 0 && !loading
  const firstNick = participants[0]?.nick ?? 'znajomego'
  const inviteLink = 'https://betmates.app/invite'

  const copyInvite = async () => {
    await Clipboard.setStringAsync(inviteLink)
    if (Platform.OS === 'android') {
      ToastAndroid.show('Link skopiowany!', ToastAndroid.SHORT)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.chipsWrap}>
        {selectedGame && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {selectedGame.emoji} {selectedGame.name}
            </Text>
            <Text style={styles.chipSep}>|</Text>
            <Pressable onPress={() => handlers.setStep(1)}>
              <Text style={styles.chipAction}>zmień</Text>
            </Pressable>
          </View>
        )}
        {!!formatMeta && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {formatMeta.icon} {formatMeta.name}
            </Text>
            <Text style={styles.chipSep}>|</Text>
            <Pressable onPress={() => handlers.setStep(2)}>
              <Text style={styles.chipAction}>zmień</Text>
            </Pressable>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
      <ScrollView
        style={{ flex: 1 }}
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 100 }}
      >
        <Text style={styles.sectionLabel}>TRYB STAWKI</Text>
        <View style={styles.modeRow}>
          {STAKE_MODES.map(mode => {
            const selected = stakeMode === mode.id
            return (
              <Animated.View key={mode.id} style={[styles.modeCol, { transform: [{ scale: modeScale(mode.id) }] }]}>
                <Pressable onPress={() => onModePress(mode.id)} style={[styles.modeCard, selected && styles.modeCardSelected]}>
                  <Text style={[styles.modeTitle, selected && styles.modeTitleSelected]}>{mode.name}</Text>
                  <Text style={[styles.modeDesc, selected && styles.modeDescSelected]}>{mode.description}</Text>
                </Pressable>
              </Animated.View>
            )
          })}
        </View>

        {stakeMode === 'equal' && (
          <View style={styles.equalRow}>
            <Text style={styles.equalLabel}>Stawka za osobę</Text>
            <TextInput
              keyboardType="numeric"
              value={stakeAmount > 0 ? String(stakeAmount) : ''}
              onChangeText={v => handlers.setStakeAmount(Number(v) || 0)}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              style={styles.equalInput}
            />
            <Text style={styles.equalSuffix}>zł</Text>
            <Text style={styles.poolAccent}>Pula: {equalPool} zł</Text>
          </View>
        )}

        {stakeMode === 'custom' && currentUser && (
          <View style={styles.customMineRow}>
            <Text style={styles.customMineLabel}>Twoja stawka</Text>
            <TextInput
              keyboardType="numeric"
              value={customStakes[currentUser.id] ? String(customStakes[currentUser.id]) : ''}
              onChangeText={v => handlers.setCustomStakes(prev => ({ ...prev, [currentUser.id]: Number(v) || 0 }))}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              style={styles.customMineInput}
            />
            <Text style={styles.equalSuffix}>zł</Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>DODAJ UCZESTNIKÓW</Text>

        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Szukaj znajomego..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        {friendsFiltered.map((friend, index) => {
          const selected = selectedIds.has(friend.id)
          return (
            <Pressable key={friend.id} onPress={() => handlers.toggleParticipant(friend)} style={[styles.friendRow, selected && styles.friendRowSelected]}>
              <View style={styles.friendAvatar}>
                <Text style={styles.friendAvatarText}>{initialsFromNick(friend.nick)}</Text>
              </View>
              <View style={styles.friendCenter}>
                <Text style={styles.friendNick}>{friend.nick}</Text>
                <Text style={styles.friendActivity}>{ACTIVITY_LABELS[index % ACTIVITY_LABELS.length]}</Text>
              </View>
              {stakeMode === 'custom' && (
                <View style={styles.friendStakeWrap}>
                  <TextInput
                    keyboardType="numeric"
                    value={customStakes[friend.id] ? String(customStakes[friend.id]) : ''}
                    onChangeText={v => handlers.setCustomStakes(prev => ({ ...prev, [friend.id]: Number(v) || 0 }))}
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.friendStakeInput}
                  />
                  <Text style={styles.friendStakeSuffix}>zł</Text>
                </View>
              )}
              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected && <Text style={styles.checkboxText}>✓</Text>}
              </View>
            </Pressable>
          )
        })}

        <View style={styles.inviteCard}>
          <View style={styles.inviteIconWrap}>
            <Text style={styles.inviteIcon}>→</Text>
          </View>
          <View style={styles.inviteTextWrap}>
            <Text style={styles.inviteTitle}>Zaproś przez link — nie musi mieć BetMates</Text>
            <Text style={styles.inviteSub}>Udostępnij link i zaproś osobę spoza aplikacji</Text>
          </View>
          <Pressable onPress={() => void copyInvite()} style={styles.copyBtn}>
            <Text style={styles.copyBtnText}>Kopiuj link</Text>
          </Pressable>
        </View>

        {stakeMode === 'custom' && (
          <Text style={styles.customSummary}>
            Pula: {customPool} zł · Twój kurs: {myOdds > 0 ? myOdds.toFixed(2) : '0.00'}×
          </Text>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeader}>PODSUMOWANIE ZAKŁADU</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gra</Text>
            <Text style={styles.summaryValue}>
              {selectedGame ? `${selectedGame.emoji} ${selectedGame.name}` : '—'} · {formatMeta?.name ?? '—'}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Stawka</Text>
            {stakeMode === 'none' ? (
              <Text style={styles.summaryMuted}>Bez stawki</Text>
            ) : stakeMode === 'equal' ? (
              <Text style={styles.summaryValue}>
                {stakeAmount || 0} zł / osoba · pula {equalPool} zł
              </Text>
            ) : (
              <Text style={styles.summaryValue}>
                {myCustomStake} zł / osoba · pula {customPool} zł
              </Text>
            )}
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Uczestnicy</Text>
            <Text style={styles.summaryParticipants}>
              {participants.length === 0
                ? 'Ty'
                : participants.length === 1
                ? `Ty + ${participants[0].nick}`
                : `Ty + ${participants.length} osób`}
            </Text>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: 6 }]}>
        <View style={styles.footerFade} />
        <Pressable onPress={() => void handlers.handleSubmit()} disabled={!canSubmit} style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}>
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={[styles.submitMain, !canSubmit && styles.submitMainDisabled]}>
                {participants.length === 0
                  ? 'Wybierz uczestników →'
                  : participants.length === 1
                  ? `Wyślij zakład do ${firstNick} →`
                  : `Wyślij do ${participants.length} osób →`}
              </Text>
              {participants.length > 0 && (
                <Text style={styles.submitSub}>
                  {participants.length === 1
                    ? `${firstNick} dostanie powiadomienie push`
                    : `${participants.length} osoby dostaną powiadomienie push`}
                </Text>
              )}
            </>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  chipsWrap: { marginHorizontal: 16, marginTop: 8, marginBottom: 12, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  chipText: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  chipSep: { color: Colors.textMuted, fontSize: 13 },
  chipAction: { color: Colors.accentLight, fontSize: 13, fontWeight: '600' },
  sectionLabel: {
    marginLeft: 16,
    marginBottom: 10,
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeCol: { flex: 1 },
  modeCard: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  modeCardSelected: {
    backgroundColor: rgbaFromHex(Colors.accent, 0.2),
    borderColor: Colors.accent,
  },
  modeTitle: { color: Colors.text, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  modeTitleSelected: { color: Colors.accentLight },
  modeDesc: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4 },
  modeDescSelected: { color: Colors.accentLight },
  equalRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  equalLabel: { color: Colors.textMuted, fontSize: 14, flex: 1 },
  equalInput: {
    width: 80,
    backgroundColor: Colors.cardAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  equalSuffix: { color: Colors.textMuted, fontSize: 14 },
  poolAccent: { color: Colors.accentLight, fontSize: 14, fontWeight: '600' },
  customMineRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customMineLabel: { color: Colors.textMuted, fontSize: 14, flex: 1 },
  customMineInput: {
    width: 80,
    backgroundColor: Colors.cardAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  searchWrap: {
    marginBottom: 12,
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIcon: { color: Colors.textMuted, fontSize: 14 },
  searchInput: { flex: 1, color: Colors.text, paddingVertical: 10, fontSize: 14 },
  friendRow: {
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendRowSelected: {
    backgroundColor: rgbaFromHex(Colors.accent, 0.12),
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: { color: Colors.accentLight, fontWeight: '700', fontSize: 14 },
  friendCenter: { flex: 1, marginHorizontal: 12 },
  friendNick: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  friendActivity: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  friendStakeWrap: { flexDirection: 'row', alignItems: 'center', marginRight: 8, gap: 4 },
  friendStakeInput: {
    width: 60,
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: Colors.text,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    textAlign: 'center',
  },
  friendStakeSuffix: { color: Colors.textMuted, fontSize: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: rgbaFromHex(Colors.text, 0.3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkboxText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  inviteCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: rgbaFromHex(Colors.text, 0.2),
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteIcon: { color: Colors.accentLight, fontSize: 12, fontWeight: '700' },
  inviteTextWrap: { flex: 1, marginHorizontal: 12, gap: 2 },
  inviteTitle: { color: Colors.text, fontSize: 14 },
  inviteSub: { color: Colors.textMuted, fontSize: 12 },
  copyBtn: { backgroundColor: Colors.accent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  copyBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  customSummary: { marginTop: 12, color: Colors.accentLight, fontSize: 14, fontWeight: '600' },
  summaryCard: {
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  summaryHeader: {
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontWeight: '700',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  summaryLabel: { color: Colors.textMuted, fontSize: 13 },
  summaryValue: { color: Colors.text, fontSize: 14, textAlign: 'right', flex: 1 },
  summaryMuted: { color: Colors.textMuted, fontSize: 14, textAlign: 'right', flex: 1 },
  summaryParticipants: { color: Colors.accentLight, fontSize: 14, fontWeight: '700', textAlign: 'right', flex: 1 },
  summaryDivider: { height: 1, backgroundColor: rgbaFromHex(Colors.text, 0.06), marginVertical: 12 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
  },
  footerFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -16,
    height: 16,
    backgroundColor: rgbaFromHex(Colors.background, 0.6),
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  submitButtonDisabled: { backgroundColor: Colors.cardAlt },
  submitMain: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  submitMainDisabled: { color: Colors.textMuted },
  submitSub: { color: rgbaFromHex(Colors.text, 0.6), fontSize: 11 },
})
