import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { styles } from './styles/SettleModal.styles'

export type SettleModalProps = {
  visible: boolean
  onClose: () => void
  friendNick: string
  balance: number
  settling: boolean
  onConfirm: (amount: number) => Promise<boolean>
}

export function SettleModal({ visible, onClose, friendNick, balance, settling, onConfirm }: SettleModalProps) {
  const [amountInput, setAmountInput] = useState('')

  useEffect(() => {
    if (visible) setAmountInput(String(Math.abs(balance)))
  }, [visible, balance])

  const direction = balance > 0 ? `${friendNick} oddał Ci` : `Oddałeś ${friendNick}`

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayTap} onPress={onClose} accessibilityRole="button" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.title}>Rozlicz saldo</Text>
            <Text style={styles.subtitle}>{direction}</Text>

            <View style={styles.inputRow}>
              <TextInput
                keyboardType="number-pad"
                value={amountInput}
                onChangeText={setAmountInput}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                autoFocus
              />
              <Text style={styles.suffix}>j.</Text>
            </View>

            <Pressable
              style={styles.confirmBtn}
              disabled={settling}
              onPress={async () => {
                const ok = await onConfirm(Number(amountInput) || 0)
                if (ok) onClose()
              }}
            >
              {settling ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.confirmBtnText}>Zapisz</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}