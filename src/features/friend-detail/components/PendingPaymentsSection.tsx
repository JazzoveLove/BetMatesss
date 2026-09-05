import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import type { PairPendingPayment } from '../api'

export type PendingPaymentsSectionProps = {
  userId: string
  friendNick: string
  items: PairPendingPayment[]
  busyId: string | null
  onConfirm: (paymentId: string) => void
  onReject: (paymentId: string) => void
  onRetract: (paymentId: string) => void
}

/**
 * Minimalna sekcja potwierdzania spłat na ekranie znajomego (pełny ekran
 * "Sprawy" przyjdzie w KROKU 3b). Dla każdej wiszącej spłaty:
 *   - jestem wierzycielem (to_user)         → [Potwierdź] [Odrzuć]
 *   - to mój wpis, czeka na drugą stronę    → [Wycofaj]
 */
export function PendingPaymentsSection({
  userId,
  friendNick,
  items,
  busyId,
  onConfirm,
  onReject,
  onRetract,
}: PendingPaymentsSectionProps) {
  if (items.length === 0) return null

  return (
    <View testID="pending-payments-section">
      <Text style={styles.label}>SPŁATY DO POTWIERDZENIA</Text>
      {items.map(item => {
        const iAmCreditor = item.toUser === userId
        const busy = busyId === item.id
        return (
          <View key={item.id} style={styles.row} testID={`pending-payment-${item.id}`}>
            <Text style={styles.text}>
              {iAmCreditor
                ? `${friendNick} oznaczył(a) spłatę ${item.amount} j.`
                : `Wysłałeś spłatę ${item.amount} j. — czeka na potwierdzenie`}
            </Text>
            {busy ? (
              <ActivityIndicator color={Colors.accent} />
            ) : iAmCreditor ? (
              <View style={styles.actions}>
                <Pressable
                  testID={`pending-payment-confirm-${item.id}`}
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={() => onConfirm(item.id)}
                >
                  <Text style={styles.btnPrimaryText}>Potwierdź</Text>
                </Pressable>
                <Pressable
                  testID={`pending-payment-reject-${item.id}`}
                  style={[styles.btn, styles.btnGhost]}
                  onPress={() => onReject(item.id)}
                >
                  <Text style={styles.btnGhostText}>Odrzuć</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable
                  testID={`pending-payment-retract-${item.id}`}
                  style={[styles.btn, styles.btnGhost]}
                  onPress={() => onRetract(item.id)}
                >
                  <Text style={styles.btnGhostText}>Wycofaj</Text>
                </Pressable>
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  label: { color: Colors.textMuted, fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  row: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 14,
    marginBottom: 8,
    gap: 10,
  },
  text: { color: Colors.text, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  btnPrimary: { backgroundColor: Colors.accent },
  btnPrimaryText: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  btnGhost: { borderWidth: 1, borderColor: Colors.border },
  btnGhostText: { color: Colors.textMuted, fontSize: 13, fontWeight: '700' },
})
