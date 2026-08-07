import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from 'react-native'
import { YStack, Button } from 'tamagui'
import { useAuth } from '../hooks/useAuth'
import { nickSchema } from '@/shared/utils/user/nickValidation'
import { getFirstValidationError } from '@/shared/utils/validation'
import { Colors } from '@/shared/constants/colors'
import { styles } from '../styles/authScreen.styles'

type Props = { userId: string; onComplete: () => void }

export default function SetupProfileScreen({ userId, onComplete }: Props) {
  const { completeProfile, loading } = useAuth()
  const [nick, setNick] = useState('')

  async function saveNick() {
    const validationError = getFirstValidationError(nickSchema.safeParse(nick))
    if (validationError) {
      Alert.alert('Nieprawidłowy nick', validationError)
      return
    }

    const result = await completeProfile(userId, nick.trim())
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

  const canSave = !loading && nick.trim().length >= 5

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[styles.content, { padding: 28 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <YStack flex={1}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={[styles.title, { fontSize: 26, fontWeight: '700', color: Colors.text }]}>Jak masz na imię?</Text>
          <Text style={[styles.subtitle, { fontSize: 14, marginBottom: 40, lineHeight: 20 }]}>Twój nick będą widzieć znajomi przy zakładach</Text>

          <TextInput
            value={nick}
            onChangeText={setNick}
            placeholder="Wpisz nick..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={saveNick}
            style={[styles.input, { fontSize: 18, textAlign: 'center', letterSpacing: 0.5, marginBottom: 0 }]}
          />
          <Text style={styles.counter}>{nick.trim().length} / 10</Text>

          <Button disabled={!canSave} onPress={saveNick} style={[styles.primaryButton, { borderRadius: 12, marginBottom: 0, opacity: canSave ? 1 : 0.4 }]}>
            <Text style={styles.primaryButtonText}>{loading ? 'Zapisywanie...' : 'Gotowe'}</Text>
          </Button>

          <Text style={styles.disclaimer}>
            BetMates nie przetwarza ani nie transferuje realnych pieniędzy — służy wyłącznie do śledzenia rywalizacji między znajomymi. Wartość jednostki ustalacie między sobą sami.
          </Text>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}