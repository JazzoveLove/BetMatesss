import { useEffect, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import type { BetFormat } from '../../../types/bet.types'
import type { GameTemplate } from '../../../constants/games'
import { Colors } from '../../../constants/colors'
import { formatDetailsStyles as styles } from './formatDetails.styles'

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

function ToggleButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.toggleButton, active ? styles.toggleActive : styles.toggleMuted]}>
      <Text style={[styles.toggleText, active ? styles.toggleTextActive : styles.toggleTextMuted]}>{label}</Text>
    </Pressable>
  )
}

export type FormatDetailsCardProps = {
  format: BetFormat
  selectedGame: GameTemplate
  bestOfCount: 3 | 5 | 7
  onBestOfChange: (n: 3 | 5 | 7) => void
  stakePerMatch: number
  onStakePerMatchChange: (n: number) => void
}

export function FormatDetailsCard({
  format: activeFormat,
  selectedGame,
  bestOfCount,
  onBestOfChange,
  stakePerMatch,
  onStakePerMatchChange,
}: FormatDetailsCardProps) {
  const [resultType, setResultType] = useState<ResultMode>('score')
  const [remisPossible, setRemisPossible] = useState<YesNo>('no')
  const [rrDrawAllowed, setRrDrawAllowed] = useState<YesNo>('no')
  const [pairingMode, setPairingMode] = useState<PairingMode>('auto')

  useEffect(() => {
    setResultType(selectedGame.resultType === 'winner_only' ? 'winner_only' : 'score')
    setRemisPossible(selectedGame.supportsRematch ? 'yes' : 'no')
  }, [selectedGame.id, selectedGame.resultType, selectedGame.supportsRematch])

  const detailsTitle = `SZCZEGÓŁY — ${LABEL_BY_FORMAT[activeFormat]}`

  return (
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
            {([3, 5, 7] as const).map(option => (
              <ToggleButton key={option} active={bestOfCount === option} label={String(option)} onPress={() => onBestOfChange(option)} />
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
              value={stakePerMatch > 0 ? String(stakePerMatch) : ''}
              onChangeText={value => onStakePerMatchChange(Number(value) || 0)}
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
  )
}
