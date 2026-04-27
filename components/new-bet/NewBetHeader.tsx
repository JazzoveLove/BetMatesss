import { Pressable, Text, View } from 'react-native'
import type { NewBetStep } from '../../hooks/useNewBet'
import { styles } from './newBetStepStyles'

type Props = {
  step: NewBetStep
  onBack: () => void
}

export function NewBetHeader({ step, onBack }: Props) {
  return (
    <>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {step === 1 ? 'Wybierz gre' : step === 2 ? 'Wybierz uczestnikow' : step === 3 ? 'Wybierz format' : 'Stawka'}
        </Text>
        <Text style={styles.headerStep}>{step}/4</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
      </View>
    </>
  )
}
