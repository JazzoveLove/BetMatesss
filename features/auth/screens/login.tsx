import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native'
import { YStack, Text, Button } from 'tamagui'
import { useAuth } from '../hooks/useAuth'
import { Colors } from '@/shared/constants/colors'
import { styles } from '../components/authScreen.styles'

type Props = { onGoToRegister: () => void }

export default function LoginScreen({ onGoToRegister }: Props) {
  const { signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSignIn() {
    try {
      await signIn(email, password)
    } catch (error) {
      Alert.alert('Błąd', error instanceof Error ? error.message : 'Nie udało się zalogować')
    }
  }

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <YStack flex={1}>
          <Text style={styles.title}>BetMates</Text>
          <Text style={styles.subtitle}>Zakłady ze znajomymi</Text>

          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Hasło" placeholderTextColor={Colors.textMuted} secureTextEntry style={styles.input} />

          <Button disabled={loading} onPress={handleSignIn} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{loading ? 'Ładowanie...' : 'Zaloguj się'}</Text>
          </Button>

          <Button disabled={loading} chromeless onPress={onGoToRegister} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Nie masz konta? Zarejestruj się</Text>
          </Button>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}