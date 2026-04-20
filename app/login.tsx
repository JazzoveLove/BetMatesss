import { useState } from 'react'
import { Alert } from 'react-native'
import { YStack, Text, Input, Button } from 'tamagui'
import { useAuth } from '../hooks/useAuth'

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
    <YStack flex={1} style={{ justifyContent: 'center', padding: 24, backgroundColor: '#0f1117' }}>
      <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#7F77DD', textAlign: 'center', marginBottom: 8 }}>
        BetMates
      </Text>
      <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 48 }}>
        Zakłady ze znajomymi
      </Text>

      <Input
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={'#666' as never}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          backgroundColor: '#181c24',
          borderWidth: 0.5,
          borderColor: '#333',
          borderRadius: 10,
          padding: 14,
          fontSize: 16,
          color: '#e8e6e0',
          marginBottom: 12,
        }}
      />
      <Input
        value={password}
        onChangeText={setPassword}
        placeholder="Hasło"
        placeholderTextColor={'#666' as never}
        secureTextEntry
        style={{
          backgroundColor: '#181c24',
          borderWidth: 0.5,
          borderColor: '#333',
          borderRadius: 10,
          padding: 14,
          fontSize: 16,
          color: '#e8e6e0',
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
  )
}
