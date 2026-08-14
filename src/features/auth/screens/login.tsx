import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../hooks/useAuth'
import { Colors } from '@/shared/constants/colors'
import { styles } from './styles/login.styles'

type Props = { onGoToWelcome: () => void }

export default function LoginScreen({ onGoToWelcome }: Props) {
  const { signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const passwordRef = useRef<TextInput>(null)

  async function handleSignIn() {
    try {
      await signIn(email, password)
    } catch (error) {
      Alert.alert('Błąd', error instanceof Error ? error.message : 'Nie udało się zalogować')
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={onGoToWelcome}
              style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.backButtonText}>{'<'}</Text>
            </Pressable>

            <Text style={styles.screenTitle}>Zaloguj się</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Adres e-mail</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Hasło</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  ref={passwordRef}
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!passwordVisible}
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                  style={[styles.input, styles.passwordInput]}
                />
                <Pressable
                  onPress={() => setPasswordVisible(v => !v)}
                  style={styles.eyeToggle}
                  hitSlop={8}
                >
                  <Ionicons
                    name={passwordVisible ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              disabled={loading}
              onPress={handleSignIn}
              style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}
            >
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryButtonText}>Zaloguj się</Text>}
            </Pressable>

            <Pressable disabled onPress={() => {}}>
              <Text style={[styles.mutedLink, styles.mutedLinkDisabled]}>Nie pamiętasz hasła?</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
