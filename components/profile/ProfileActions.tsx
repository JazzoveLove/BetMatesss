import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { hexToRgba } from '../../utils/colors'

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

const styles = StyleSheet.create({
  actionsRow: { marginHorizontal: 16, marginTop: 16, marginBottom: 32, flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionText: { color: Colors.text, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  actionEditText: { color: Colors.accentLight, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  logoutButton: {
    flex: 1,
    backgroundColor: hexToRgba(Colors.red, 0.12),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.red, 0.3),
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: { color: Colors.red, fontSize: 13, fontWeight: '700', textAlign: 'center' },
})
