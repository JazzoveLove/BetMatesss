import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "../../constants/colors";
import type { BetStatus, Settlement } from "../../types/bet.types";
import { hexToRgba } from "../../utils/colors";

export type BetActionsPanelProps = {
  status: BetStatus;
  isCreator: boolean;
  accepting: boolean;
  rejecting: boolean;
  confirming: boolean;
  disputing: boolean;
  resolving: boolean;
  markingPaid: string | null;
  confirmingPayment: string | null;
  rejectingPayment: string | null;
  reminding: string | null;
  myDebt: Settlement | null;
  myCredit: Settlement | null;
  allPaid: boolean;
  opponent: { nick: string };
  onAccept: () => void;
  onReject: () => void;
  onConfirm: () => void;
  onDispute: () => void;
  onMarkPaid: (id: string, debtorId: string) => void;
  onConfirmPayment: (id: string, creditorId: string) => void;
  onRejectPayment: (id: string, creditorId: string) => void;
  onRemind: (settlement: Settlement) => void;
  onOpenScoreModal: () => void;
  paddingBottom: number;
};

export function BetActionsPanel({
  status,
  isCreator,
  accepting,
  rejecting,
  confirming,
  disputing,
  resolving: _resolving,
  markingPaid,
  confirmingPayment,
  rejectingPayment,
  reminding,
  myDebt,
  myCredit,
  allPaid,
  opponent,
  onAccept,
  onReject,
  onConfirm,
  onDispute,
  onMarkPaid,
  onConfirmPayment,
  onRejectPayment,
  onRemind,
  onOpenScoreModal,
  paddingBottom,
}: BetActionsPanelProps) {
  return (
    <View style={[styles.bottomActions, { paddingBottom }]}>
      {status === "pending" && !isCreator && (
        <View style={styles.gap8}>
          <Pressable style={styles.primaryAction} onPress={onAccept}>
            {accepting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryActionText}>Akceptuj zakład →</Text>
            )}
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={onReject}>
            {rejecting ? (
              <ActivityIndicator color={Colors.red} />
            ) : (
              <Text style={styles.rejectText}>Odrzuć</Text>
            )}
          </Pressable>
        </View>
      )}

      {status === "active" && (
        <Pressable style={styles.primaryAction} onPress={onOpenScoreModal}>
          <Text style={styles.primaryActionText}>Wpisz wynik meczu →</Text>
        </Pressable>
      )}

      {status === "awaiting_confirmation" && !isCreator && (
        <View style={styles.gap8}>
          <Pressable
            style={[styles.primaryAction, { backgroundColor: Colors.green }]}
            onPress={onConfirm}
          >
            {confirming ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryActionText}>Potwierdź wynik ✓</Text>
            )}
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={onDispute}>
            {disputing ? (
              <ActivityIndicator color={Colors.red} />
            ) : (
              <Text style={styles.rejectText}>Zgłoś spór</Text>
            )}
          </Pressable>
        </View>
      )}

      {status === "completed" && !allPaid && (
        <View style={styles.gap8}>
          {myDebt && myDebt.paymentStatus === "unpaid" ? (
            <Pressable
              style={styles.primaryAction}
              onPress={() => void onMarkPaid(myDebt.id, myDebt.debtorId)}
            >
              {markingPaid === myDebt.id ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryActionText}>Zapłacono →</Text>
              )}
            </Pressable>
          ) : null}

          {myDebt && myDebt.paymentStatus === "pending_confirmation" ? (
            <View style={styles.secondaryAction}>
              <Text style={styles.muted}>Oczekuje na potwierdzenie...</Text>
            </View>
          ) : null}

          {myDebt && myDebt.paymentStatus === "paid" ? (
            <View style={styles.secondaryAction}>
              <Text style={styles.allPaidText}>Zapłacono ✅</Text>
            </View>
          ) : null}

          {myCredit && myCredit.paymentStatus === "pending_confirmation" ? (
            <View style={styles.gap8}>
              <Pressable
                style={[styles.primaryAction, { backgroundColor: Colors.green }]}
                onPress={() => void onConfirmPayment(myCredit.id, myCredit.creditorId)}
              >
                {confirmingPayment === myCredit.id ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryActionText}>Potwierdź otrzymanie ✓</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.secondaryAction}
                onPress={() => void onRejectPayment(myCredit.id, myCredit.creditorId)}
              >
                {rejectingPayment === myCredit.id ? (
                  <ActivityIndicator color={Colors.red} />
                ) : (
                  <Text style={styles.rejectText}>Odrzuć</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {myCredit && myCredit.paymentStatus === "unpaid" ? (
            <Pressable
              style={styles.secondaryAction}
              onPress={() => void onRemind(myCredit)}
            >
              {reminding === myCredit.id ? (
                <ActivityIndicator color={Colors.amber} />
              ) : (
                <Text style={styles.muted}>Przypomnij {opponent.nick} →</Text>
              )}
            </Pressable>
          ) : null}

          {myCredit && myCredit.paymentStatus === "paid" ? (
            <View style={styles.secondaryAction}>
              <Text style={styles.allPaidText}>Otrzymano ✅</Text>
            </View>
          ) : null}

          {myCredit && myCredit.paymentStatus === "disputed" ? (
            <View style={styles.secondaryAction}>
              <Text style={styles.rejectText}>Spór 🔴</Text>
            </View>
          ) : null}
        </View>
      )}

      {status === "completed" && allPaid && (
        <Text style={styles.allPaidText}>Zakład rozliczony ✓</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomActions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: hexToRgba(Colors.background, 0.95),
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  gap8: { gap: 8 },
  primaryAction: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  secondaryAction: {
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectText: { color: Colors.red, fontSize: 14, fontWeight: "600" },
  muted: { color: Colors.textMuted, fontSize: 13 },
  allPaidText: { color: Colors.green, textAlign: "center" },
});
