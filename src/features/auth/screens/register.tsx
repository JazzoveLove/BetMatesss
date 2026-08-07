import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { Colors } from '@/shared/constants/colors'
import { styles } from '../styles/authScreen.styles'

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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>BetMates</Text>
          <Text style={styles.subtitle}>Załóż konto</Text>

          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Hasło" placeholderTextColor={Colors.textMuted} secureTextEntry style={styles.input} />

          <Pressable
            disabled={loading}
            onPress={handleSignUp}
            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Ładowanie...' : 'Zarejestruj się'}</Text>
          </Pressable>

          <Pressable
            disabled={loading}
            onPress={onGoToLogin}
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.secondaryButtonText}>Masz już konto? Zaloguj się</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}