import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
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
    <View style={styles.container}>
      <Text style={styles.title}>BetMates</Text>
      <Text style={styles.subtitle}>Zakłady ze znajomymi</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Hasło"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.btnPrimary} onPress={handleSignIn} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Ładowanie...' : 'Zaloguj się'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnSecondary} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.btnTextSecondary}>Zarejestruj się</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0f1117',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#7F77DD',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  input: {
    backgroundColor: '#181c24',
    borderWidth: 0.5,
    borderColor: '#333',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#e8e6e0',
    marginBottom: 12,
  },
  btnPrimary: {
    backgroundColor: '#534AB7',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnSecondary: {
    borderWidth: 0.5,
    borderColor: '#534AB7',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  btnTextSecondary: { color: '#7F77DD', fontSize: 16 },
})
