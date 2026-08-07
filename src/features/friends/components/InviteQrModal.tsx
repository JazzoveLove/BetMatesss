import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { Colors } from '@/shared/constants/colors'
import { styles } from './styles/InviteQrModal.styles'

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
