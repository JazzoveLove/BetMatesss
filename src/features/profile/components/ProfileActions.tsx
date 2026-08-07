import { Alert, Pressable, Text, View } from 'react-native'
import { styles } from './styles/ProfileActions.styles'

export type ProfileActionsProps = {
  onSettings: () => void
  onEditProfile: () => void
  onLogout: () => void
}

export function ProfileActions({ onSettings, onEditProfile, onLogout }: ProfileActionsProps) {
  function handleLogout() {
    Alert.alert('Wylogowanie', 'Czy na pewno chcesz się wylogować?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Wyloguj', style: 'destructive', onPress: onLogout },
    ])
  }

  return (
    <View style={styles.actionsRow}>
      <Pressable style={styles.actionButton} onPress={onSettings}>
        <Text style={styles.actionText}>⚙️ Ustawienia</Text>
      </Pressable>
      <Pressable style={styles.actionButton} onPress={onEditProfile}>
        <Text style={styles.actionEditText}>✏️ Edytuj profil</Text>
      </Pressable>
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Wyloguj</Text>
      </Pressable>
    </View>
  )
}
