import { Modal, Pressable, Text, TextInput, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { styles } from './styles/EditProfileModal.styles'

export type EditProfileModalProps = {
  visible: boolean
  draftNick: string
  onChangeNick: (nick: string) => void
  onPickAvatar: () => void
  onCancel: () => void
  onSave: () => void
}

export function EditProfileModal({
  visible,
  draftNick,
  onChangeNick,
  onPickAvatar,
  onCancel,
  onSave,
}: EditProfileModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edytuj profil</Text>
          <Pressable style={styles.modalAvatarButton} onPress={onPickAvatar}>
            <Text style={styles.modalAvatarText}>📷 Zmień avatar</Text>
          </Pressable>
          <TextInput
            value={draftNick}
            onChangeText={onChangeNick}
            placeholder="Nick"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.modalAction} onPress={onCancel}>
              <Text style={styles.modalActionText}>Anuluj</Text>
            </Pressable>
            <Pressable style={styles.modalAction} onPress={onSave}>
              <Text style={styles.modalActionText}>Zapisz</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
