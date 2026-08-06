import { Pressable, Text, View } from 'react-native'
import { gameScreenStyles as styles } from './gameScreen.styles'

export type StepGameFooterProps = {
  canProceed: boolean
  selectedLabel?: string
  onNext: () => void
}

export function StepGameFooter({ canProceed, selectedLabel, onNext }: StepGameFooterProps) {
  return (
    <View style={[styles.footer, { paddingBottom: 6 }]}>
      <View style={styles.footerFade} />
      <Pressable onPress={onNext} disabled={!canProceed} style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}>
        <Text style={[styles.nextMainText, !canProceed && styles.nextMainTextDisabled]}>Dalej — wybierz format →</Text>
        {canProceed && selectedLabel && <Text style={styles.nextSubText}>Wybrano: {selectedLabel}</Text>}
      </Pressable>
    </View>
  )
}
