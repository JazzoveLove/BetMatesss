import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { hexToRgba } from '../../utils/colors'

export type FriendsAddModalProps = {
  visible: boolean
  onClose: () => void
  onCopyLink: () => void
  onShareInvite: () => void
  inviteCode: string | null
  /** Zachowanie: otwiera wyszukiwanie po nicku (jak wcześniej „Wpisz nick”). */
  onOpenNickSearch: () => void
  /** Zachowanie: alert z kodem / QR (jak wcześniej „Pokaż QR”). */
  onShowQr: () => void
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
  modalTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  modalOption: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  modalOptionText: { color: Colors.text, fontSize: 14, fontWeight: '500' },
  modalClose: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.accent,
  },
  modalCloseText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
})

export function FriendsAddModal({
  visible,
  onClose,
  onCopyLink,
  onShareInvite,
  inviteCode,
  onOpenNickSearch,
  onShowQr,
}: FriendsAddModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Dodaj znajomego</Text>
          <Pressable
            style={styles.modalOption}
            onPress={() => {
              void onCopyLink()
              onClose()
            }}
          >
            <Text style={styles.modalOptionText}>Kopiuj link</Text>
          </Pressable>
          <Pressable
            style={styles.modalOption}
            onPress={() => {
              void onShareInvite()
              onClose()
            }}
          >
            <Text style={styles.modalOptionText}>Udostępnij</Text>
          </Pressable>
          <Pressable
            style={styles.modalOption}
            onPress={() => {
              onClose()
              onOpenNickSearch()
            }}
          >
            <Text style={styles.modalOptionText}>Wpisz nick</Text>
          </Pressable>
          <Pressable
            testID={inviteCode ? 'friends-add-qr-has-code' : 'friends-add-qr-no-code'}
            style={styles.modalOption}
            onPress={() => {
              onClose()
              onShowQr()
            }}
          >
            <Text style={styles.modalOptionText}>Pokaż QR</Text>
          </Pressable>
          <Pressable style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Zamknij</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
