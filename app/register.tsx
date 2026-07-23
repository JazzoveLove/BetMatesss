import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native'
import { YStack, Text, Button } from 'tamagui'
import { useAuth } from '../hooks/useAuth'
import { Colors } from '../constants/colors'
import { styles } from '../components/auth/authScreen.styles'

type Props = { onGoToLogin: () => void }

export default function RegisterScreen({ onGoToLogin }: Props) {
  const { signUp, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSignUp() {
    try {
      await signUp(email, password)
      Alert.alert('Gotowe!', 'Sprawdź e-mail i potwierdź konto')
    } catch (error) {
      Alert.alert('Błąd', error instanceof Error ? error.message : 'Nie udało się zarejestrować')
    }
  }

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <YStack flex={1}>
          <Text style={styles.title}>BetMates</Text>
          <Text style={styles.subtitle}>Załóż konto</Text>

          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Hasło" placeholderTextColor={Colors.textMuted} secureTextEntry style={styles.input} />

          <Button disabled={loading} onPress={handleSignUp} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{loading ? 'Ładowanie...' : 'Zarejestruj się'}</Text>
          </Button>

          <Button disabled={loading} chromeless onPress={onGoToLogin} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Masz już konto? Zaloguj się</Text>
          </Button>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}