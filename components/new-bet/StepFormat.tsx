import type { ComponentType } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import type { BetFormat } from '../../types/bet.types'
import type { NewBetHandlers, NewBetState } from '../../hooks/useNewBet'
import type { FormatConfigProps } from './formatConfigProps'
import { BestOfConfig } from './format-configs/BestOfConfig'
import { PerMatchConfig } from './format-configs/PerMatchConfig'
import { PokerConfig } from './format-configs/PokerConfig'
import { styles } from './newBetStepStyles'

const BET_FORMATS: { id: BetFormat; name: string; description: string; icon: string }[] = [
  { id: 'single', name: 'Jeden mecz', description: 'Pojedynczy wynik meczu', icon: '1' },
  { id: 'best_of', name: 'Best of X', description: 'Do 3, 5 lub 7 wygranych', icon: 'BO' },
  { id: 'per_match', name: 'Zakład za mecz', description: 'Każdy mecz liczony osobno', icon: 'PM' },
  { id: 'round_robin', name: 'Round Robin', description: 'Kazdy z kazdym', icon: 'RR' },
  { id: 'elimination', name: 'Eliminacje', description: 'Drabinka pucharowa', icon: 'KO' },
  { id: 'session', name: 'Sesja wielu gier', description: 'Wiele gier w jednej sesji', icon: 'S' },
]

const FORMAT_CONFIGS: Partial<Record<BetFormat, ComponentType<FormatConfigProps>>> = {
  best_of: BestOfConfig,
  per_match: PerMatchConfig,
}

type Props = {
  state: NewBetState
  handlers: NewBetHandlers
}

export function StepFormat({ state, handlers }: Props) {
  const { selectedGame, availableFormats, selectedFormat } = state
  if (!selectedGame) return null

  return (
    <ScrollView style={styles.stepBody}>
      {availableFormats.map(formatId => {
        const format = BET_FORMATS.find(f => f.id === formatId)
        if (!format) return null
        const isSelected = selectedFormat === formatId
        const FormatConfig = FORMAT_CONFIGS[formatId]
        const showPoker =
          selectedGame.id === 'poker' && formatId === 'single' && isSelected

        return (
          <Pressable
            key={formatId}
            onPress={() => handlers.setSelectedFormat(formatId)}
            style={[styles.formatCard, isSelected && styles.formatCardSelected]}
          >
            <Text style={styles.formatIcon}>{format.icon}</Text>
            <View style={styles.formatMain}>
              <Text style={styles.formatName}>{format.name}</Text>
              <Text style={styles.formatDesc}>{format.description}</Text>
            </View>
            <View style={[styles.radio, isSelected && styles.radioSelected]} />
            {isSelected && FormatConfig && <FormatConfig state={state} handlers={handlers} />}
            {showPoker && <PokerConfig state={state} handlers={handlers} />}
          </Pressable>
        )
      })}
      <Pressable
        onPress={() => {
          if (selectedFormat === 'per_match') {
            void handlers.handleSubmit()
            return
          }
          handlers.setStep(4)
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Dalej {'->'}</Text>
      </Pressable>
    </ScrollView>
  )
}
