import { TextInput, View } from 'react-native'
import { Colors } from '../../../constants/colors'
import type { GameTemplate } from '../../../constants/games'
import { CustomGameCard } from './CustomGameCard'
import { gameScreenStyles as styles } from './gameScreen.styles'

export type StepGameCustomSectionProps = {
  customOpen: boolean
  customName: string
  setCustomName: (v: string) => void
  selectedIsWlasna: boolean
  wlasnaGame: GameTemplate | undefined
  onSelect: (game: GameTemplate) => void
  onCustomOpen: () => void
}

export function StepGameCustomSection({
  customOpen,
  customName,
  setCustomName,
  selectedIsWlasna,
  wlasnaGame,
  onSelect,
  onCustomOpen,
}: StepGameCustomSectionProps) {
  return (
    <View style={styles.customWrap}>
      <CustomGameCard selected={selectedIsWlasna} onSelect={onCustomOpen} />
      {(customOpen || selectedIsWlasna) && wlasnaGame && (
        <View style={styles.customInputWrap}>
          <TextInput
            value={customName}
            onChangeText={value => {
              setCustomName(value)
              onSelect(wlasnaGame)
            }}
            placeholder="Np. Rzuty wolne, Pompki challenge..."
            placeholderTextColor={Colors.textMuted}
            style={styles.customInput}
            autoFocus
          />
        </View>
      )}
    </View>
  )
}
