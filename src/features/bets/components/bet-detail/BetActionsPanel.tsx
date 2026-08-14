import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Colors } from "@/shared/constants/colors";
import type { BetStatus } from "@/features/bets/types/bet.types";
import { styles } from "./styles/BetActionsPanel.styles";

export type BetActionsPanelProps = {
  status: BetStatus;
  isCreator: boolean;
  canConfirmResult: boolean;
  accepting: boolean;
  rejecting: boolean;
  confirming: boolean;
  disputing: boolean;
  cancelling: boolean;
  resolving: boolean;
  onAccept: () => void;
  onReject: () => void;
  onConfirm: () => void;
  onDispute: () => void;
  onCancel: () => void;
  onOpenScoreModal: () => void;
  paddingBottom: number;
};

export function BetActionsPanel({
  status,
  isCreator,
  canConfirmResult,
  accepting,
  rejecting,
  confirming,
  disputing,
  cancelling,
  resolving: _resolving,
  onAccept,
  onReject,
  onConfirm,
  onDispute,
  onCancel,
  onOpenScoreModal,
  paddingBottom,
}: BetActionsPanelProps) {
  return (
    <View style={[styles.bottomActions, { paddingBottom }]}>
      {status === "pending" && !isCreator && (
        <View style={styles.gap8}>
          <Pressable style={styles.primaryAction} onPress={onAccept} disabled={accepting}>
            {accepting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryActionText}>Akceptuj zakład →</Text>
            )}
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={onReject} disabled={rejecting}>
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

      {status === "awaiting_confirmation" && canConfirmResult && (
        <View style={styles.gap8}>
          <Pressable
            style={[styles.primaryAction, { backgroundColor: Colors.green }]}
            onPress={onConfirm}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryActionText}>Potwierdź wynik ✓</Text>
            )}
          </Pressable>
          <Pressable style={styles.secondaryAction} onPress={onDispute} disabled={disputing}>
            {disputing ? (
              <ActivityIndicator color={Colors.red} />
            ) : (
              <Text style={styles.rejectText}>Zgłoś spór</Text>
            )}
          </Pressable>
        </View>
      )}

      {status === "disputed" && (
        <Pressable style={styles.secondaryAction} onPress={onCancel} disabled={cancelling}>
          {cancelling ? (
            <ActivityIndicator color={Colors.red} />
          ) : (
            <Text style={styles.rejectText}>Anuluj zakład</Text>
          )}
        </Pressable>
      )}

      {status === "completed" && (
        <Text style={styles.allPaidText}>Zakład zakończony ✓</Text>
      )}

      {status === "rejected" && (
        <Text style={styles.rejectedText}>Zakład odrzucony 🚫</Text>
      )}

      {status === "cancelled" && (
        <Text style={styles.rejectedText}>Zakład anulowany 🚫</Text>
      )}
    </View>
  );
}
