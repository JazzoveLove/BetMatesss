import { Platform, Pressable, Text, ToastAndroid, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { stepStakeStyles as styles } from './stepStake.styles'

const INVITE_LINK = 'https://betmates.app/invite'

export function StepStakeInviteCard() {
  const copyInvite = async () => {
    await Clipboard.setStringAsync(INVITE_LINK)
    if (Platform.OS === 'android') ToastAndroid.show('Link skopiowany!', ToastAndroid.SHORT)
  }

  return (
    <View style={styles.inviteCard}>
      <View style={styles.inviteIconWrap}>
        <Text style={styles.inviteIcon}>→</Text>
      </View>
      <View style={styles.inviteTextWrap}>
        <Text style={styles.inviteTitle}>Zaproś przez link — nie musi mieć BetMates</Text>
        <Text style={styles.inviteSub}>Udostępnij link i zaproś osobę spoza aplikacji</Text>
      </View>
      <Pressable onPress={() => void copyInvite()} style={styles.copyBtn}>
        <Text style={styles.copyBtnText}>Kopiuj link</Text>
      </Pressable>
    </View>
  )
}
