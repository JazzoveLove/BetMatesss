import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Colors } from "@/shared/constants/colors";
import { styles } from "./styles/BetScoreModal.styles";

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
  scoringLabel?: string | null;
};

export function parsePendingScore(score: string): ScoreState {
  if (!score) return { myScore: null, opponentScore: null };
  const [a, b] = score.split(":");
  const myScore = Number.parseInt(a ?? "", 10);
  const opponentScore = Number.parseInt(b ?? "", 10);
  return {
    myScore: Number.isNaN(myScore) ? null : myScore,
    opponentScore: Number.isNaN(opponentScore) ? null : opponentScore,
  };
}

export function resolveModalResult(
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
  scoringLabel,
}: BetScoreModalProps) {
  const [myScoreInput, setMyScoreInput] = useState("");
  const [opponentScoreInput, setOpponentScoreInput] = useState("");
  const [winnerOnlyId, setWinnerOnlyId] = useState<string | null>(null);
  const isNumericResult = resultType !== "winner_only";

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

            {isNumericResult && (
              <>
                {!!scoringLabel && (
                  <Text style={styles.scoringLabel}>{scoringLabel}</Text>
                )}
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
              </>
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
