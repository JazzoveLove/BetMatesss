import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native'
import { YStack, Text, Button } from 'tamagui'
import { useAuth } from '../hooks/useAuth'
import { Colors } from '../constants/colors'

export default function LoginScreen() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    try {
      setLoading(true)
      await signIn(email, password)
    } catch (error) {
      Alert.alert('Blad', error instanceof Error ? error.message : 'Nie udalo sie zalogowac')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp() {
    try {
      setLoading(true)
      await signUp(email, password)
      Alert.alert('Gotowe!', 'Sprawdz email i potwierdz konto')
    } catch (error) {
      Alert.alert('Blad', error instanceof Error ? error.message : 'Nie udalo sie zarejestrowac')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f1117' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack flex={1}>
          <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#7F77DD', textAlign: 'center', marginBottom: 8 }}>
            BetMates
          </Text>
          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 48 }}>
            Zakłady ze znajomymi
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              backgroundColor: Colors.cardAlt,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: Colors.text,
              fontSize: 16,
              marginBottom: 12,
            }}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Hasło"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            style={{
              backgroundColor: Colors.cardAlt,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: Colors.text,
              fontSize: 16,
              marginBottom: 12,
            }}
          />

          <Button
            disabled={loading}
            onPress={handleSignIn}
            style={{
              backgroundColor: '#534AB7',
              borderRadius: 10,
              height: 52,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              {loading ? 'Ładowanie...' : 'Zaloguj się'}
            </Text>
          </Button>

          <Button
            disabled={loading}
            chromeless
            onPress={handleSignUp}
            style={{
              borderWidth: 0.5,
              borderColor: '#534AB7',
              borderRadius: 10,
              height: 52,
              backgroundColor: 'transparent',
            }}
          >
            <Text style={{ color: '#7F77DD', fontSize: 16 }}>Zarejestruj się</Text>
          </Button>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
