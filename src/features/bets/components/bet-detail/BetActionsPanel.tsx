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
  resolving: boolean;
  onAccept: () => void;
  onReject: () => void;
  onConfirm: () => void;
  onDispute: () => void;
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
  resolving: _resolving,
  onAccept,
  onReject,
  onConfirm,
  onDispute,
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

      {status === "awaiting_confirmation" && canConfirmResult && (
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

      {status === "completed" && (
        <Text style={styles.allPaidText}>Zakład zakończony ✓</Text>
      )}

      {status === "rejected" && (
        <Text style={styles.rejectedText}>Zakład odrzucony 🚫</Text>
      )}
    </View>
  );
}
