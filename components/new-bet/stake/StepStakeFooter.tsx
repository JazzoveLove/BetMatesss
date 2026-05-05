import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { Colors } from '../../../constants/colors'
import type { NewBetHandlers } from '../../../hooks/useNewBet'
import type { UserProfile } from '../../../types/user.types'
import { stepStakeStyles as styles } from './stepStake.styles'

export type StepStakeFooterProps = {
  participants: UserProfile[]
  loading: boolean
  canSubmit: boolean
  canPressSubmit: boolean
  errorMessage?: string | null
  onSubmitAttempt?: () => void
  handlers: Pick<NewBetHandlers, 'handleSubmit'>
}

export function StepStakeFooter({
  participants,
  loading,
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
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Text style={[styles.submitMain, !canSubmit && styles.submitMainDisabled]}>
              {participants.length === 0
                ? 'Wybierz uczestników →'
                : participants.length === 1
                  ? `Wyślij zakład do ${firstNick} →`
                  : `Wyślij do ${participants.length} osób →`}
            </Text>
            {participants.length > 0 && (
              <Text style={styles.submitSub}>
                {participants.length === 1 ? `${firstNick} dostanie powiadomienie push` : `${participants.length} osoby dostaną powiadomienie push`}
              </Text>
            )}
          </>
        )}
      </Pressable>
      {!!errorMessage && <Text style={styles.footerError}>{errorMessage}</Text>}
    </View>
  )
}
