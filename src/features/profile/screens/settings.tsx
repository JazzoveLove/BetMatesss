import { useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Constants from 'expo-constants'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth'
import { UsersService } from '@/shared/lib/users.service'
import { styles } from './styles/settings.styles'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/navigation/types'

// TODO: podmienić przed submitem do sklepów (dokumenty jeszcze nie istnieją — to Faza 3 planu wydania)
const PRIVACY_POLICY_URL = 'https://betmates.app/privacy'
const TERMS_URL = 'https://betmates.app/terms'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>()
  const { signOut } = useAuth()
  const [deleting, setDeleting] = useState(false)

  function handleDeleteAccount() {
    Alert.alert(
      'Usunąć konto?',
      'Tej operacji nie można cofnąć. Twój profil i dane osobowe zostaną usunięte, historia zakładów pozostanie widoczna u Twoich znajomych w formie anonimowej.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń konto',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            const result = await UsersService.deleteMyAccount()
            if (result.error) {
              Alert.alert('Błąd', result.error)
              setDeleting(false)
              return
            }
            await signOut()
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView style={styles.safeTop} edges={['top']}>
      <SafeAreaView style={styles.safeBottom} edges={['bottom']}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>{'<'}</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Ustawienia</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>O aplikacji</Text>
            <Text style={styles.cardText}>
              BetMates nie przetwarza ani nie transferuje realnych pieniędzy — służy wyłącznie do
              śledzenia rywalizacji między znajomymi. Wartość jednostki ustalacie między sobą sami,
              poza aplikacją.
            </Text>
          </View>

          <View style={styles.card}>
            <Pressable style={styles.linkRow} onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}>
              <Text style={styles.linkText}>Polityka prywatności</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.linkRow} onPress={() => void Linking.openURL(TERMS_URL)}>
              <Text style={styles.linkText}>Regulamin</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Konto</Text>
            <Pressable
              style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              <Text style={styles.deleteButtonText}>Usuń konto</Text>
            </Pressable>
          </View>

          <Text style={styles.version}>Wersja {Constants.expoConfig?.version ?? '—'}</Text>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaView>
  )
}
