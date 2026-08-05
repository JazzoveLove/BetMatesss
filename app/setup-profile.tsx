import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput } from 'react-native'
import { YStack, Button } from 'tamagui'
import { useAuth } from '../hooks/useAuth'
import { nickSchema } from '../utils/user/nickValidation'
import { getFirstValidationError } from '@/shared/utils/validation'
import { Colors } from '@/shared/constants/colors'

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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <YStack flex={1}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>Jak masz na imię?</Text>
          <Text style={styles.subtitle}>Twój nick będą widzieć znajomi przy zakładach</Text>

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
            style={styles.input}
          />
          <Text style={styles.counter}>{nick.trim().length} / 10</Text>

          <Button disabled={!canSave} onPress={saveNick} style={[styles.saveButton, { opacity: canSave ? 1 : 0.4 }]}>
            <Text style={styles.saveButtonText}>{loading ? 'Zapisywanie...' : 'Gotowe'}</Text>
          </Button>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 40, lineHeight: 20 },
  input: {
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
  },
  counter: { fontSize: 12, color: Colors.textFaint, textAlign: 'right', marginTop: 6, marginBottom: 32 },
  saveButton: { backgroundColor: Colors.accent, borderRadius: 12, height: 52 },
  saveButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
})