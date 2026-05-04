import { Pressable, Text, View } from 'react-native'
import { BET_FORMATS } from '../../../constants/formats'
import type { GameTemplate } from '../../../constants/games'
import type { BetFormat } from '../../../types/bet.types'
import type { NewBetHandlers } from '../../../hooks/useNewBet'
import { stepStakeStyles as styles } from './stepStake.styles'

export type StepStakeChipsProps = {
  selectedGame: GameTemplate | null
  selectedFormat: BetFormat | null
  handlers: Pick<NewBetHandlers, 'setStep'>
}

export function StepStakeChips({ selectedGame, selectedFormat, handlers }: StepStakeChipsProps) {
  const formatMeta = BET_FORMATS.find(item => item.id === selectedFormat)
  return (
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
  )
}
