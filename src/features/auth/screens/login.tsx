import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { Colors } from '@/shared/constants/colors'
import { styles } from '../styles/authScreen.styles'

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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>BetMates</Text>
          <Text style={styles.subtitle}>Zakłady ze znajomymi</Text>

          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Hasło" placeholderTextColor={Colors.textMuted} secureTextEntry style={styles.input} />

          <Pressable
            disabled={loading}
            onPress={handleSignIn}
            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Ładowanie...' : 'Zaloguj się'}</Text>
          </Pressable>

          <Pressable
            disabled={loading}
            onPress={onGoToRegister}
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.secondaryButtonText}>Nie masz konta? Zarejestruj się</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}