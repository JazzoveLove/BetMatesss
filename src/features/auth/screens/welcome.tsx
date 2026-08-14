import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { styles } from './styles/welcome.styles'

type Props = { onGoToLogin: () => void; onGoToRegister: () => void }

export default function WelcomeScreen({ onGoToLogin, onGoToRegister }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.welcomeContent}>
        <View style={styles.welcomeHero}>
          <View style={styles.logoBox}>
            <Text style={styles.logoBoxText}>B</Text>
          </View>
          <Text style={styles.appName}>BetMates</Text>
        </View>

        <View style={styles.welcomeActions}>
          <Pressable
            onPress={onGoToRegister}
            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.primaryButtonText}>Zarejestruj się</Text>
          </Pressable>

          <Pressable
            onPress={onGoToLogin}
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.secondaryButtonText}>Zaloguj się</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Pressable disabled onPress={() => {}}>
              <Text style={styles.footerLink}>Warunki</Text>
            </Pressable>
            <Text style={styles.footerDivider}>|</Text>
            <Pressable disabled onPress={() => {}}>
              <Text style={styles.footerLink}>Polityka prywatności</Text>
            </Pressable>
            <Text style={styles.footerDivider}>|</Text>
            <Pressable disabled onPress={() => {}}>
              <Text style={styles.footerLink}>Skontaktuj się z nami</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
