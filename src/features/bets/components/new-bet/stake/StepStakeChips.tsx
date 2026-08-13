import { Pressable, Text, View } from 'react-native'
import type { GameTemplate } from '@/shared/constants/games'
import type { NewBetHandlers } from '@/features/bets/hooks/useNewBet'
import { stepStakeStyles as styles } from './styles/stepStake.styles'

export type StepStakeChipsProps = {
  selectedGame: GameTemplate | null
  handlers: Pick<NewBetHandlers, 'setStep'>
}

export function StepStakeChips({ selectedGame, handlers }: StepStakeChipsProps) {
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
    </View>
  )
}
