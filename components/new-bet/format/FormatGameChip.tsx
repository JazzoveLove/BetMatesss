import { Pressable, Text, View } from 'react-native'
import type { GameTemplate } from '../../../constants/games'
import type { NewBetHandlers } from '../../../hooks/useNewBet'
import { formatScreenStyles as styles } from './formatScreen.styles'

export type FormatGameChipProps = {
  selectedGame: GameTemplate
  handlers: Pick<NewBetHandlers, 'setStep'>
}

export function FormatGameChip({ selectedGame, handlers }: FormatGameChipProps) {
  return (
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
  )
}
