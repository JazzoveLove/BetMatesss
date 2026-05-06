import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { hexToRgba } from '../../utils/colors'

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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: hexToRgba(Colors.background, 0.7),
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalAvatarButton: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatarText: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: 12,
    color: Colors.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  modalActions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  modalAction: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalActionText: { color: Colors.text, fontSize: 13, fontWeight: '700' },
})
