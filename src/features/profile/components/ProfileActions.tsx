import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/shared/constants/colors'
import { styles } from './styles/ProfileActions.styles'

export type ProfileActionsProps = {
  onSettings: () => void
  onEditProfile: () => void
  onBalances: () => void
}

export function ProfileActions({ onSettings, onEditProfile, onBalances }: ProfileActionsProps) {
  return (
    <View style={styles.actionsWrap}>
      <View style={styles.actionsRow}>
        <Pressable style={styles.actionButton} onPress={onSettings}>
          <Ionicons name="settings-outline" size={16} color={Colors.text} />
          <Text style={styles.actionText}>Ustawienia</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onEditProfile}>
          <Ionicons name="pencil-outline" size={16} color={Colors.accentLight} />
          <Text style={styles.actionEditText}>Edytuj profil</Text>
        </Pressable>
      </View>
      <Pressable style={[styles.actionButton, styles.balancesButton]} onPress={onBalances}>
        <Ionicons name="swap-horizontal-outline" size={16} color={Colors.text} />
        <Text style={styles.actionText}>Bilanse</Text>
      </Pressable>
    </View>
  )
}
