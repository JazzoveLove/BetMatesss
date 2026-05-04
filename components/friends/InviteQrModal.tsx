import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { Colors } from '../../constants/colors'
import { hexToRgba } from '../../utils/colors'

export type InviteQrModalProps = {
  visible: boolean
  onClose: () => void
  userId: string | null
}

export function InviteQrModal({ visible, onClose, userId }: InviteQrModalProps) {
  const value = userId ? `betmates://friends?add=${userId}` : ''

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} accessibilityRole="button" />
        <View style={styles.card}>
          <Text style={styles.title}>Zeskanuj, aby dodać</Text>
          {value ? (
            <View style={styles.qrWrap}>
              <QRCode value={value} size={220} backgroundColor={Colors.white} color="#000000" />
            </View>
          ) : (
            <Text style={styles.hint}>Brak danych użytkownika.</Text>
          )}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Zamknij</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: hexToRgba(Colors.background, 0.75),
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    zIndex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  title: { color: Colors.text, fontSize: 17, fontWeight: '700', marginBottom: 16 },
  qrWrap: {
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  hint: { color: Colors.textMuted, fontSize: 14 },
  closeBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.cardAlt,
  },
  closeBtnText: { color: Colors.accentLight, fontSize: 15, fontWeight: '600' },
})
