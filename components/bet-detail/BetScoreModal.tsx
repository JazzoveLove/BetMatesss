import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Colors } from "../../constants/colors";
import { hexToRgba } from "../../utils/colors";

export type ScoreState = {
  myScore: number | null;
  opponentScore: number | null;
};

export type BetScoreModalProps = {
  visible: boolean;
  onClose: () => void;
  resultType: string;
  me: { id: string; nick: string };
  opponent: { id: string; nick: string };
  resolving: boolean;
  onSubmit: (winnerId: string, score: string) => Promise<boolean>;
};

export function parsePendingScore(score: string): ScoreState {
  if (!score) return { myScore: null, opponentScore: null };
  const [a, b] = score.split(":");
  return {
    myScore: Number.parseInt(a ?? "", 10) || null,
    opponentScore: Number.parseInt(b ?? "", 10) || null,
  };
}

function resolveModalResult(
  resultType: string,
  meId: string,
  opponentId: string,
  myScore: string,
  opponentScore: string,
  winnerOnlyId: string | null,
) {
  if (resultType === "winner_only")
    return {
      winnerId: winnerOnlyId,
      score: winnerOnlyId ? "winner_only" : null,
    };
  const a = Number.parseInt(myScore, 10);
  const b = Number.parseInt(opponentScore, 10);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b)
    return { winnerId: null, score: null };
  return { winnerId: a > b ? meId : opponentId, score: `${a}:${b}` };
}

export function BetScoreModal({
  visible,
  onClose,
  resultType,
  me,
  opponent,
  resolving,
  onSubmit,
}: BetScoreModalProps) {
  const [myScoreInput, setMyScoreInput] = useState("");
  const [opponentScoreInput, setOpponentScoreInput] = useState("");
  const [winnerOnlyId, setWinnerOnlyId] = useState<string | null>(null);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Wpisz wynik</Text>

            {resultType === "score" && (
              <View style={styles.scoreInputs}>
                <TextInput
                  style={styles.bigInput}
                  keyboardType="number-pad"
                  value={myScoreInput}
                  onChangeText={setMyScoreInput}
                />
                <Text style={styles.muted}>:</Text>
                <TextInput
                  style={styles.bigInput}
                  keyboardType="number-pad"
                  value={opponentScoreInput}
                  onChangeText={setOpponentScoreInput}
                />
              </View>
            )}

            {resultType === "winner_only" && (
              <View style={styles.winnerOnlyGap}>
                <Pressable
                  style={[
                    styles.secondaryAction,
                    winnerOnlyId === me.id && styles.selectedAction,
                  ]}
                  onPress={() => setWinnerOnlyId(me.id)}
                >
                  <Text style={styles.bodyText}>{me.nick}</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.secondaryAction,
                    winnerOnlyId === opponent.id && styles.selectedAction,
                  ]}
                  onPress={() => setWinnerOnlyId(opponent.id)}
                >
                  <Text style={styles.bodyText}>{opponent.nick}</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={[styles.primaryAction, { marginTop: 16 }]}
              onPress={async () => {
                const payload = resolveModalResult(
                  resultType,
                  me.id,
                  opponent.id,
                  myScoreInput,
                  opponentScoreInput,
                  winnerOnlyId,
                );
                if (!payload.winnerId || !payload.score) return;
                const ok = await onSubmit(payload.winnerId, payload.score);
                if (ok) onClose();
              }}
            >
              {resolving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryActionText}>Zapisz wynik</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: hexToRgba(Colors.background, 0.55),
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: hexToRgba(Colors.white, 0.2),
    marginBottom: 16,
  },
  sheetTitle: { color: Colors.text, fontWeight: "700", fontSize: 17 },
  scoreInputs: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bigInput: {
    flex: 1,
    height: 80,
    borderRadius: 14,
    backgroundColor: Colors.cardAlt,
    color: Colors.text,
    fontSize: 40,
    textAlign: "center",
    fontWeight: "700",
  },
  muted: { color: Colors.textMuted, fontSize: 13 },
  winnerOnlyGap: { gap: 8 },
  bodyText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
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
  selectedAction: {
    borderColor: Colors.accent,
    backgroundColor: hexToRgba(Colors.accent, 0.15),
  },
});
