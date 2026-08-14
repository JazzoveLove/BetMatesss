import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import type { NewBetHandlers } from '@/features/bets/hooks/useNewBet'
import type { UserProfile } from '@/shared/types/user.types'
import { stepStakeStyles as styles } from './styles/stepStake.styles'

export type StepStakeFooterProps = {
  participants: UserProfile[]
  loading: boolean
  isSubmitting: boolean
  canSubmit: boolean
  canPressSubmit: boolean
  errorMessage?: string | null
  onSubmitAttempt?: () => void
  handlers: Pick<NewBetHandlers, 'handleSubmit'>
}

export function StepStakeFooter({
  participants,
  loading,
  isSubmitting,
  canSubmit,
  canPressSubmit,
  errorMessage,
  onSubmitAttempt,
  handlers,
}: StepStakeFooterProps) {
  const firstNick = participants[0]?.nick ?? 'znajomego'

  return (
    <View style={[styles.footer, { paddingBottom: 6 }]}>
      <View style={styles.footerFade} />
      <Pressable
        onPress={() => {
          if (!canSubmit) {
            onSubmitAttempt?.()
            return
          }
          void handlers.handleSubmit()
        }}
        disabled={!canPressSubmit}
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
      >
        {(loading || isSubmitting) ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Text style={[styles.submitMain, !canSubmit && styles.submitMainDisabled]}>
              {participants.length === 0
                ? 'Wybierz uczestników →'
                : `Wyślij zakład do ${firstNick} →`}
            </Text>
            {participants.length > 0 && (
              <Text style={styles.submitSub}>
                {firstNick} zobaczy zaproszenie w zakładce Znajomi
              </Text>
            )}
          </>
        )}
      </Pressable>
      {!!errorMessage && <Text style={styles.footerError}>{errorMessage}</Text>}
    </View>
  )
}
