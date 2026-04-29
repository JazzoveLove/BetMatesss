import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Colors } from "../constants/colors";
import { GAME_MAP, GAME_TEMPLATES } from "../constants/games";
import type { BetStatus } from "../types/bet.types";
import { useBetDetail } from "../hooks/useBetDetail";
import { hexToRgba } from "../utils/colors";

type RootParamList = {
  BetDetail: {
    betId: string;
  };
};

type ScoreState = {
  myScore: number | null;
  opponentScore: number | null;
};

export default function BetDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RootParamList, "BetDetail">>();
  const navigation = useNavigation<any>();
  const { betId } = route.params;

  const {
    loading,
    bet,
    settlements,
    currentUserId,
    pendingResult,
    resolving,
    confirming,
    disputing,
    accepting,
    rejecting,
    markingPaid,
    reminding,
    submitResult,
    confirmResult,
    disputeResult,
    acceptBet,
    rejectBet,
    markPaid,
    sendReminder,
  } = useBetDetail(betId);

  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [myScoreInput, setMyScoreInput] = useState("");
  const [opponentScoreInput, setOpponentScoreInput] = useState("");
  const [winnerOnlyId, setWinnerOnlyId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");

  const me = useMemo(
    () => bet?.participants.find((p) => p.id === currentUserId) ?? null,
    [bet, currentUserId],
  );
  const opponent = useMemo(
    () => bet?.participants.find((p) => p.id !== currentUserId) ?? null,
    [bet, currentUserId],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accentLight} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!bet || !me || !opponent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.muted}>Nie znaleziono zakładu.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = bet.status as BetStatus;
  const isCreator = me.role === "creator";
  const game = GAME_MAP[bet.gameTemplate] ?? {
    emoji: "🎲",
    label: bet.gameTemplate,
  };
  const gameTemplate = GAME_TEMPLATES.find((g) => g.id === bet.gameTemplate);
  const resultType = gameTemplate?.resultType ?? "score";

  const scoreState: ScoreState = parsePendingScore(pendingResult?.score ?? "");
  const winnerId = pendingResult?.winnerId ?? null;
  const totalPool =
    me.stakeAmount > 0 && opponent.stakeAmount > 0
      ? me.stakeAmount + opponent.stakeAmount
      : null;

  const myDebt =
    settlements.find((s) => s.debtorId === currentUserId && !s.paid) ?? null;
  const myCredit =
    settlements.find((s) => s.creditorId === currentUserId && !s.paid) ?? null;
  const allPaid = settlements.length > 0 && settlements.every((s) => s.paid);

  const badge = getStatusBadge(status);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.iconTxt}>{"<"}</Text>
        </Pressable>
        <Text style={styles.title}>Szczegóły zakładu</Text>
        <Pressable
          style={styles.iconBtn}
          onPress={() =>
            Alert.alert("Akcje", undefined, [
              { text: "Anuluj zakład" },
              { text: "Zgłoś spór", onPress: () => void disputeResult() },
              { text: "Udostępnij" },
              { text: "Anuluj", style: "cancel" },
            ])
          }
        >
          <Text style={styles.iconTxt}>···</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.badge,
            { backgroundColor: badge.bg, borderColor: badge.border },
          ]}
        >
          <Text style={[styles.badgeText, { color: badge.text }]}>
            {badge.label}
          </Text>
        </View>
        <Text style={styles.muted}>
          · utworzony{" "}
          {new Date(bet.createdAt).toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.vsRow}>
            <PlayerCard
              nick={me.nick}
              initials={initials(me.nick)}
              stake={me.stakeAmount}
              me
            />
            <Text style={styles.muted}>VS</Text>
            <PlayerCard
              nick={opponent.nick}
              initials={initials(opponent.nick)}
              stake={opponent.stakeAmount}
              me={false}
            />
          </View>

          <View style={styles.infoRow}>
            <InfoItem
              label="DYSCYPLINA"
              value={`${game.emoji} ${game.label}`}
            />
            <InfoItem label="FORMAT" value={bet.format} />
            <InfoItem
              label="PULA"
              value={totalPool ? `${totalPool} zł` : "—"}
              valueColor={Colors.accentLight}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>WYNIK MECZU</Text>
        <View style={styles.card}>
          <View style={styles.scoreRow}>
            <View
              style={[
                styles.scoreBox,
                winnerId === me.id && styles.scoreWinner,
              ]}
            >
              <Text style={styles.scoreNick}>{me.nick}</Text>
              <Text style={styles.scoreValue}>{scoreState.myScore ?? "?"}</Text>
            </View>
            <Text style={styles.scoreColon}>:</Text>
            <View
              style={[
                styles.scoreBox,
                winnerId === opponent.id && styles.scoreWinner,
              ]}
            >
              <Text style={styles.scoreNick}>{opponent.nick}</Text>
              <Text style={styles.scoreValue}>
                {scoreState.opponentScore ?? "?"}
              </Text>
            </View>
          </View>
          <Text style={styles.muted}>
            {status === "pending" &&
              `Zakład czeka na akceptację przez ${opponent.nick}.`}
            {status === "active" &&
              `Po meczu wpisz wynik — ${opponent.nick} dostanie powiadomienie.`}
            {status === "awaiting_confirmation" &&
              "Wynik wpisany. Potwierdź lub zgłoś spór."}
            {status === "completed" && "Mecz zakończony."}
          </Text>
        </View>

        {status === "completed" && bet.stakeMode !== "none" && (
          <>
            <Text style={styles.sectionLabel}>ROZLICZENIE</Text>
            <View style={styles.card}>
              {settlements.map((s) => (
                <View
                  key={s.id}
                  style={[styles.settlementRow, s.paid && { opacity: 0.5 }]}
                >
                  <Text style={styles.bodyText}>
                    {s.debtorNick} jest winien {s.creditorNick}
                  </Text>
                  <Text
                    style={[
                      styles.bodyText,
                      {
                        color:
                          s.debtorId === currentUserId
                            ? Colors.red
                            : Colors.green,
                      },
                    ]}
                  >
                    {s.amount} zł
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>CZAT</Text>
        <View style={styles.card}>
          <Text style={styles.muted}>
            Mini czat będzie podpięty pod hook po dodaniu messages.
          </Text>
        </View>
        <View style={styles.chatRow}>
          <TextInput
            style={styles.input}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Napisz wiadomość..."
            placeholderTextColor={Colors.textMuted}
          />
          <Pressable style={styles.sendBtn}>
            <Text style={{ color: Colors.white }}>→</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View
        style={[styles.bottomActions, { paddingBottom: insets.bottom + 12 }]}
      >
        {status === "pending" && !isCreator && (
          <View style={{ gap: 8 }}>
            <Pressable
              style={styles.primaryAction}
              onPress={() => void acceptBet()}
            >
              {accepting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryActionText}>Akceptuj zakład →</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.secondaryAction}
              onPress={() => void rejectBet()}
            >
              {rejecting ? (
                <ActivityIndicator color={Colors.red} />
              ) : (
                <Text style={styles.rejectText}>Odrzuć</Text>
              )}
            </Pressable>
          </View>
        )}

        {status === "active" && (
          <Pressable
            style={styles.primaryAction}
            onPress={() => setScoreModalOpen(true)}
          >
            <Text style={styles.primaryActionText}>Wpisz wynik meczu →</Text>
          </Pressable>
        )}

        {status === "awaiting_confirmation" && !isCreator && (
          <View style={{ gap: 8 }}>
            <Pressable
              style={[styles.primaryAction, { backgroundColor: Colors.green }]}
              onPress={() => void confirmResult()}
            >
              {confirming ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryActionText}>Potwierdź wynik ✓</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.secondaryAction}
              onPress={() => void disputeResult()}
            >
              {disputing ? (
                <ActivityIndicator color={Colors.red} />
              ) : (
                <Text style={styles.rejectText}>Zgłoś spór</Text>
              )}
            </Pressable>
          </View>
        )}

        {status === "completed" && !allPaid && (
          <View style={{ gap: 8 }}>
            {myDebt ? (
              <Pressable
                style={styles.primaryAction}
                onPress={() => void markPaid(myDebt.id, myDebt.debtorId)}
              >
                {markingPaid === myDebt.id ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryActionText}>Zapłacono →</Text>
                )}
              </Pressable>
            ) : null}
            {myCredit ? (
              <Pressable
                style={styles.secondaryAction}
                onPress={() => void sendReminder(myCredit)}
              >
                {reminding === myCredit.id ? (
                  <ActivityIndicator color={Colors.amber} />
                ) : (
                  <Text style={styles.muted}>Przypomnij {opponent.nick} →</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        )}

        {status === "completed" && allPaid && (
          <Text style={{ color: Colors.green, textAlign: "center" }}>
            Zakład rozliczony ✓
          </Text>
        )}
      </View>

      <Modal
        visible={scoreModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setScoreModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.title}>Wpisz wynik</Text>

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
                <View style={{ gap: 8 }}>
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
                  const ok = await submitResult(
                    payload.winnerId,
                    payload.score,
                  );
                  if (ok) setScoreModalOpen(false);
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
    </SafeAreaView>
  );
}

function PlayerCard({
  nick,
  initials: initial,
  stake,
  me,
}: {
  nick: string;
  initials: string;
  stake: number;
  me: boolean;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: me ? Colors.accent : Colors.cardAlt },
        ]}
      >
        <Text
          style={{
            color: me ? Colors.white : Colors.accentLight,
            fontWeight: "700",
          }}
        >
          {initial}
        </Text>
      </View>
      <Text style={styles.bodyText}>{nick}</Text>
      <Text style={styles.muted}>{stake > 0 ? `${stake} zł` : "—"}</Text>
    </View>
  );
}

function InfoItem({
  label,
  value,
  valueColor = Colors.text,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ color: valueColor, fontSize: 13, fontWeight: "600" }}>
        {value}
      </Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

function parsePendingScore(score: string): ScoreState {
  if (!score) return { myScore: null, opponentScore: null };
  const [a, b] = score.split(":");
  return {
    myScore: Number.parseInt(a ?? "", 10) || null,
    opponentScore: Number.parseInt(b ?? "", 10) || null,
  };
}

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getStatusBadge(status: BetStatus) {
  if (status === "active" || status === "in_progress") {
    return {
      label: "Aktywny",
      bg: hexToRgba(Colors.green, 0.15),
      text: Colors.green,
      border: hexToRgba(Colors.green, 0.2),
    };
  }
  if (status === "pending") {
    return {
      label: "Oczekuje",
      bg: hexToRgba(Colors.amber, 0.15),
      text: Colors.amber,
      border: hexToRgba(Colors.amber, 0.2),
    };
  }
  if (status === "awaiting_confirmation") {
    return {
      label: "Czeka na potwierdzenie",
      bg: hexToRgba(Colors.textMuted, 0.15),
      text: Colors.textMuted,
      border: hexToRgba(Colors.textMuted, 0.2),
    };
  }
  if (status === "completed") {
    return {
      label: "Zakończony",
      bg: hexToRgba(Colors.accent, 0.15),
      text: Colors.accentLight,
      border: hexToRgba(Colors.accent, 0.2),
    };
  }
  return {
    label: "Spór",
    bg: hexToRgba(Colors.red, 0.15),
    text: Colors.red,
    border: hexToRgba(Colors.red, 0.2),
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTxt: { color: Colors.text, fontWeight: "700" },
  title: { color: Colors.text, fontWeight: "700", fontSize: 17 },
  statusRow: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  card: {
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
  vsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  bodyText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  muted: { color: Colors.textMuted, fontSize: 13 },
  infoRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    flexDirection: "row",
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
  },
  sectionLabel: {
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 12,
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreBox: {
    width: 112,
    height: 84,
    borderRadius: 12,
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreWinner: {
    borderColor: Colors.green,
    backgroundColor: hexToRgba(Colors.green, 0.12),
  },
  scoreNick: { color: Colors.textMuted, fontSize: 12, marginBottom: 6 },
  scoreValue: { color: Colors.text, fontSize: 32, fontWeight: "700" },
  scoreColon: {
    marginHorizontal: 12,
    color: Colors.textMuted,
    fontSize: 28,
    fontWeight: "700",
  },
  settlementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  chatRow: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: Colors.text,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomActions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: hexToRgba(Colors.background, 0.95),
    paddingHorizontal: 16,
    paddingTop: 12,
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
  rejectText: { color: Colors.red, fontSize: 14, fontWeight: "600" },
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
  selectedAction: {
    borderColor: Colors.accent,
    backgroundColor: hexToRgba(Colors.accent, 0.15),
  },
});
