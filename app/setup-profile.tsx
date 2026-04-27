import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native'
import { YStack, Text, Button } from 'tamagui'
import { useAuth } from '../hooks/useAuth'
import { Colors } from '../constants/colors'

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

  const canSave = !loading && nick.trim().length >= 2

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f1117' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <YStack flex={1}>
          <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>👋</Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: '#e8e6e0', textAlign: 'center', marginBottom: 8 }}>
            Jak masz na imię?
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: 'rgba(232,230,224,0.5)',
              textAlign: 'center',
              marginBottom: 40,
              lineHeight: 20,
            }}
          >
            Twój nick będą widzieć znajomi przy zakładach
          </Text>

          <TextInput
            value={nick}
            onChangeText={setNick}
            placeholder="Wpisz nick..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            returnKeyType="done"
            onSubmitEditing={saveNick}
            style={{
              backgroundColor: Colors.cardAlt,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 18,
              color: Colors.text,
              textAlign: 'center',
              letterSpacing: 0.5,
            }}
          />

          <Text style={{ fontSize: 12, color: 'rgba(232,230,224,0.3)', textAlign: 'right', marginTop: 6, marginBottom: 32 }}>
            {nick.trim().length} / 20
          </Text>

          <Button
            disabled={!canSave}
            onPress={saveNick}
            style={{
              backgroundColor: '#534AB7',
              borderRadius: 12,
              height: 52,
              opacity: canSave ? 1 : 0.4,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              {loading ? 'Zapisywanie...' : 'Gotowe'}
            </Text>
          </Button>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
