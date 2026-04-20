import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useAuth } from '../hooks/useAuth'

type Props = {
  userId: string
  onComplete: () => void
}

export default function SetupProfileScreen({ userId, onComplete }: Props) {
  const { completeProfile } = useAuth()
  const [nick, setNick] = useState('')
  const [loading, setLoading] = useState(false)

  async function saveNick() {
    const trimmed = nick.trim()
    if (trimmed.length < 2) {
      Alert.alert('Za krótki nick', 'Nick musi mieć co najmniej 2 znaki.')
      return
    }
    if (trimmed.length > 20) {
      Alert.alert('Za długi nick', 'Nick może mieć maksymalnie 20 znaków.')
      return
    }

    setLoading(true)

    const result = await completeProfile(userId, trimmed)
    setLoading(false)

    if (result.error) {
      if (result.code === '23505') {
        Alert.alert('Nick zajęty', 'Ten nick jest już używany. Wybierz inny.')
      } else {
        Alert.alert('Błąd', result.error)
      }
      return
    }

    onComplete()
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.emoji}>👋</Text>
        <Text style={styles.title}>Jak masz na imię?</Text>
        <Text style={styles.subtitle}>
          Twój nick będą widzieć znajomi przy zakładach
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Wpisz nick..."
          placeholderTextColor="rgba(232,230,224,0.3)"
          value={nick}
          onChangeText={setNick}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          returnKeyType="done"
          onSubmitEditing={saveNick}
        />

        <Text style={styles.hint}>{nick.trim().length} / 20</Text>

        <TouchableOpacity
          style={[styles.btn, (loading || nick.trim().length < 2) && styles.btnDisabled]}
          onPress={saveNick}
          disabled={loading || nick.trim().length < 2}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>
            {loading ? 'Zapisywanie...' : 'Gotowe'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#e8e6e0',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(232,230,224,0.5)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#181c24',
    borderWidth: 0.5,
    borderColor: '#1e2330',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#e8e6e0',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(232,230,224,0.3)',
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 32,
  },
  btn: {
    backgroundColor: '#534AB7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
