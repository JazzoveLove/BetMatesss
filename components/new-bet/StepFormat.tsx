import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BetFormat } from '../../types/bet.types'
import { Colors } from '../../constants/colors'
import { BET_FORMATS } from '../../constants/formats'
import type { NewBetHandlers, NewBetState } from '../../hooks/useNewBet'

type ResultMode = 'score' | 'winner_only'
type YesNo = 'yes' | 'no'
type PairingMode = 'auto' | 'manual'

const LABEL_BY_FORMAT: Record<BetFormat, string> = {
  single: 'Jeden mecz',
  best_of: 'Best of X',
  per_match: 'Zakład za mecz',
  round_robin: 'Round Robin',
  elimination: 'Eliminacje',
  session: 'Sesja wielu gier',
}

type Props = {
  state: NewBetState
  handlers: NewBetHandlers
}

function rgbaFromHex(hexColor: string, alpha: number): string {
  const parsed = hexColor.replace('#', '')
  const num = Number.parseInt(parsed, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r},${g},${b},${alpha})`
}

function ToggleButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.toggleButton, active ? styles.toggleActive : styles.toggleMuted]}>
      <Text style={[styles.toggleText, active ? styles.toggleTextActive : styles.toggleTextMuted]}>{label}</Text>
    </Pressable>
  )
}

export function StepFormat({ state, handlers }: Props) {
  const insets = useSafeAreaInsets()
  const { selectedGame, availableFormats, selectedFormat } = state
  const [resultType, setResultType] = useState<ResultMode>('score')
  const [remisPossible, setRemisPossible] = useState<YesNo>('no')
  const [rrDrawAllowed, setRrDrawAllowed] = useState<YesNo>('no')
  const [pairingMode, setPairingMode] = useState<PairingMode>('auto')
  const scalesRef = useRef<Record<string, Animated.Value>>({})

  if (!selectedGame) return null

  useEffect(() => {
    setResultType(selectedGame.resultType === 'winner_only' ? 'winner_only' : 'score')
    setRemisPossible(selectedGame.supportsRematch ? 'yes' : 'no')
  }, [selectedGame.id, selectedGame.resultType, selectedGame.supportsRematch])

  useEffect(() => {
    if (selectedFormat) return
    handlers.setSelectedFormat(selectedGame.defaultFormat)
  }, [handlers, selectedFormat, selectedGame.defaultFormat])

  const formatSource = availableFormats.length > 0 ? availableFormats : selectedGame.availableFormats

  useEffect(() => {
    if (selectedFormat && formatSource.includes(selectedFormat)) return
    if (formatSource.length > 0) handlers.setSelectedFormat(formatSource[0])
  }, [formatSource, handlers, selectedFormat])

  const formatItems = useMemo(() => BET_FORMATS.filter(item => formatSource.includes(item.id)), [formatSource])
  const activeFormat = selectedFormat ?? formatItems[0]?.id ?? selectedGame.defaultFormat
  const activeFormatMeta = BET_FORMATS.find(item => item.id === activeFormat)
  const detailsTitle = `SZCZEGÓŁY — ${LABEL_BY_FORMAT[activeFormat]}`

  const ensureScale = (id: string): Animated.Value => {
    if (!scalesRef.current[id]) scalesRef.current[id] = new Animated.Value(1)
    return scalesRef.current[id]
  }

  const handleFormatSelect = (formatId: BetFormat) => {
    const scale = ensureScale(formatId)
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.98, duration: 50, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start(() => handlers.setSelectedFormat(formatId))
  }

  return (
    <View style={styles.container}>
      <View style={styles.gameChipWrap}>
        <View style={styles.gameChip}>
          <Text style={styles.gameChipText}>
            {selectedGame.emoji} {selectedGame.name}
          </Text>
          <Text style={styles.gameChipSep}>|</Text>
          <Pressable onPress={() => handlers.setStep(1)}>
            <Text style={styles.gameChipAction}>zmień</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.sectionLabel}>WYBIERZ FORMAT ROZGRYWKI</Text>

      <ScrollView
        style={{ flex: 1 }}
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 100 }}
      >
        <View style={styles.listWrap}>
          {formatItems.map(item => {
            const isSelected = activeFormat === item.id
            const scale = ensureScale(item.id)
            return (
              <Animated.View key={item.id} style={{ transform: [{ scale }] }}>
                <Pressable onPress={() => handleFormatSelect(item.id)} style={[styles.formatRow, isSelected && styles.formatRowSelected]}>
                  <View style={styles.formatIconBox}>
                    <Text style={styles.formatIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.formatMain}>
                    <Text style={styles.formatName}>{item.name}</Text>
                    <Text style={styles.formatDesc}>{item.description}</Text>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <Text style={styles.radioCheck}>✓</Text>}
                  </View>
                </Pressable>
              </Animated.View>
            )
          })}
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsHeader}>{detailsTitle}</Text>

          {activeFormat === 'single' && (
            <View style={styles.detailsBody}>
              <Text style={styles.rowLabel}>Typ wyniku:</Text>
              <View style={styles.toggleRow}>
                <ToggleButton active={resultType === 'score'} label="Wynik (5:3)" onPress={() => setResultType('score')} />
                <ToggleButton active={resultType === 'winner_only'} label="Zwycięzca" onPress={() => setResultType('winner_only')} />
              </View>
              <Text style={styles.rowLabel}>Remis możliwy?</Text>
              <View style={styles.toggleRow}>
                <ToggleButton active={remisPossible === 'yes'} label="Tak" onPress={() => setRemisPossible('yes')} />
                <ToggleButton active={remisPossible === 'no'} label="Nie" onPress={() => setRemisPossible('no')} />
              </View>
            </View>
          )}

          {activeFormat === 'best_of' && (
            <View style={styles.detailsBody}>
              <Text style={styles.rowLabel}>Liczba meczów:</Text>
              <View style={styles.toggleRow}>
                {[3, 5, 7].map(option => (
                  <ToggleButton key={option} active={state.bestOfCount === option} label={String(option)} onPress={() => handlers.setBestOfCount(option as 3 | 5 | 7)} />
                ))}
              </View>
              <Text style={styles.rowLabel}>Typ wyniku:</Text>
              <View style={styles.toggleRow}>
                <ToggleButton active={resultType === 'score'} label="Wynik (5:3)" onPress={() => setResultType('score')} />
                <ToggleButton active={resultType === 'winner_only'} label="Zwycięzca" onPress={() => setResultType('winner_only')} />
              </View>
            </View>
          )}

          {activeFormat === 'per_match' && (
            <View style={styles.detailsBody}>
              <Text style={styles.rowLabel}>Stawka za mecz:</Text>
              <View style={styles.inputRow}>
                <TextInput
                  keyboardType="numeric"
                  value={state.stakePerMatch > 0 ? String(state.stakePerMatch) : ''}
                  onChangeText={value => handlers.setStakePerMatch(Number(value) || 0)}
                  placeholder="np. 10"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.stakeInput}
                />
                <Text style={styles.suffix}>zł</Text>
              </View>
            </View>
          )}

          {activeFormat === 'round_robin' && (
            <View style={styles.detailsBody}>
              <Text style={styles.rowLabel}>Typ wyniku:</Text>
              <View style={styles.toggleRow}>
                <ToggleButton active={resultType === 'score'} label="Wynik (5:3)" onPress={() => setResultType('score')} />
                <ToggleButton active={resultType === 'winner_only'} label="Zwycięzca" onPress={() => setResultType('winner_only')} />
              </View>
              <Text style={styles.rowLabel}>Remis przy równej liczbie wygranych?</Text>
              <View style={styles.toggleRow}>
                <ToggleButton active={rrDrawAllowed === 'yes'} label="Tak" onPress={() => setRrDrawAllowed('yes')} />
                <ToggleButton active={rrDrawAllowed === 'no'} label="Nie" onPress={() => setRrDrawAllowed('no')} />
              </View>
            </View>
          )}

          {activeFormat === 'elimination' && (
            <View style={styles.detailsBody}>
              <Text style={styles.rowLabel}>Losowanie par:</Text>
              <View style={styles.toggleRow}>
                <ToggleButton active={pairingMode === 'auto'} label="Automatyczne" onPress={() => setPairingMode('auto')} />
                <ToggleButton active={pairingMode === 'manual'} label="Ręczne" onPress={() => setPairingMode('manual')} />
              </View>
            </View>
          )}

          {activeFormat === 'session' && (
            <View style={styles.detailsBody}>
              <Text style={styles.sessionInfo}>Dodasz dyscypliny po stworzeniu sesji</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 6 }]}>
        <View style={styles.footerFade} />
        <Pressable onPress={() => handlers.setStep(3)} style={styles.nextButton}>
          <Text style={styles.nextMainText}>Dalej — stawki i znajomi →</Text>
          <Text style={styles.nextSubText}>{selectedGame.name} · {activeFormatMeta?.name ?? LABEL_BY_FORMAT[activeFormat]}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gameChipWrap: { marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  gameChip: {
    alignSelf: 'flex-start',
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
  gameChipText: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  gameChipSep: { color: Colors.textMuted, fontSize: 13 },
  gameChipAction: { color: Colors.accentLight, fontSize: 13, fontWeight: '600' },
  sectionLabel: {
    marginHorizontal: 16,
    marginBottom: 8,
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  listWrap: { gap: 8, flex: 1 },
  formatRow: {
    minHeight: 56,
    borderRadius: 14,
    padding: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
  },
  formatRowSelected: { backgroundColor: rgbaFromHex(Colors.accent, 0.12), borderColor: Colors.accent },
  formatIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatIcon: { fontSize: 18 },
  formatMain: { flex: 1, marginHorizontal: 12 },
  formatName: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  formatDesc: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.accent, backgroundColor: Colors.accent },
  radioCheck: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  detailsCard: {
    marginHorizontal: 0,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  detailsHeader: {
    marginBottom: 12,
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  detailsBody: { gap: 10 },
  rowLabel: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  toggleButton: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1 },
  toggleActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  toggleMuted: { backgroundColor: Colors.cardAlt, borderColor: Colors.borderSoft },
  toggleText: { fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: Colors.white },
  toggleTextMuted: { color: Colors.textMuted },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stakeInput: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: Colors.text,
    fontSize: 15,
  },
  suffix: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  sessionInfo: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  footerFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -16,
    height: 16,
    backgroundColor: rgbaFromHex(Colors.background, 0.6),
  },
  nextButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  nextMainText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  nextSubText: { color: rgbaFromHex(Colors.text, 0.6), fontSize: 11 },
})
