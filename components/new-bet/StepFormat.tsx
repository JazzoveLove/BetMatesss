import { useEffect, useMemo } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { BET_FORMATS } from '../../constants/formats'
import type { NewBetHandlers, NewBetState } from '../../hooks/useNewBet'
import type { BetFormat } from '../../types/bet.types'
import { FormatDetailsCard } from './format/FormatDetailsCard'
import { FormatGameChip } from './format/FormatGameChip'
import { FORMAT_STEP_LABELS } from './format/formatLabels'
import { FormatOptionList } from './format/FormatOptionList'
import { formatScreenStyles as styles } from './format/formatScreen.styles'

type Props = { state: NewBetState; handlers: NewBetHandlers }

export function StepFormat({ state, handlers }: Props) {
  const { selectedGame, availableFormats, selectedFormat, bestOfCount, stakePerMatch } = state

  useEffect(() => {
    if (!selectedGame) return
    if (selectedFormat) return
    handlers.setSelectedFormat(selectedGame.defaultFormat)
  }, [handlers, selectedFormat, selectedGame])

  const formatSource = useMemo(() => {
    if (!selectedGame) return [] as BetFormat[]
    return availableFormats.length > 0 ? availableFormats : selectedGame.availableFormats
  }, [availableFormats, selectedGame])

  useEffect(() => {
    if (!selectedGame) return
    if (selectedFormat && formatSource.includes(selectedFormat)) return
    if (formatSource.length > 0) handlers.setSelectedFormat(formatSource[0])
  }, [formatSource, handlers, selectedFormat, selectedGame])

  const formatItems = useMemo(() => BET_FORMATS.filter(item => formatSource.includes(item.id)), [formatSource])
  const activeFormat = selectedFormat ?? formatItems[0]?.id ?? selectedGame?.defaultFormat ?? 'single'
  const activeFormatMeta = BET_FORMATS.find(item => item.id === activeFormat)

  if (!selectedGame) return null

  return (
    <View style={styles.container}>
      <FormatGameChip selectedGame={selectedGame} handlers={handlers} />
      <Text style={styles.sectionLabel}>WYBIERZ FORMAT ROZGRYWKI</Text>

      <ScrollView style={{ flex: 1 }} bounces showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingBottom: 100 }}>
        <FormatOptionList
          formats={formatItems}
          selected={selectedFormat}
          activeFormat={activeFormat}
          onSelect={f => handlers.setSelectedFormat(f)}
        />
        <FormatDetailsCard
          format={activeFormat}
          selectedGame={selectedGame}
          bestOfCount={bestOfCount}
          onBestOfChange={handlers.setBestOfCount}
          stakePerMatch={stakePerMatch}
          onStakePerMatchChange={handlers.setStakePerMatch}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 6 }]}>
        <View style={styles.footerFade} />
        <Pressable onPress={() => handlers.setStep(3)} style={styles.nextButton}>
          <Text style={styles.nextMainText}>Dalej — stawki i znajomi →</Text>
          <Text style={styles.nextSubText}>
            {selectedGame.name} · {activeFormatMeta?.name ?? FORMAT_STEP_LABELS[activeFormat]}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
