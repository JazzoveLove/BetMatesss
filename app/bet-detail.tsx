import { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { BetActionsPanel } from "../components/bet-detail/BetActionsPanel";
import { BetDetailHeaderSection } from "../components/bet-detail/BetDetailHeaderSection";
import { BetDetailScrollBody } from "../components/bet-detail/BetDetailScrollBody";
import { BetScoreModal, parsePendingScore } from "../components/bet-detail/BetScoreModal";
import { Colors } from "../constants/colors";
import { GAME_MAP, GAME_TEMPLATES } from "../constants/games";
import { useBetDetail } from "../hooks/useBetDetail";
import type { BetStatus } from "../types/bet.types";
import { hexToRgba } from "../utils/colors";
import { styles } from "./bet-detail.styles";

export default function BetDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<{ BetDetail: { betId: string } }, "BetDetail">>();
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
  const scoreState = parsePendingScore(pendingResult?.score ?? "");
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
      <BetDetailHeaderSection
        paddingTop={insets.top + 12}
        onBack={() => navigation.goBack()}
        onDispute={disputeResult}
        badge={badge}
        createdAt={bet.createdAt}
      />

      <BetDetailScrollBody
        me={me}
        opponent={opponent}
        meInitials={initials(me.nick)}
        opponentInitials={initials(opponent.nick)}
        game={game}
        bet={bet}
        totalPool={totalPool}
        scoreState={scoreState}
        winnerId={winnerId}
        status={status}
        settlements={settlements}
        currentUserId={currentUserId}
        chatInput={chatInput}
        setChatInput={setChatInput}
      />

      <BetActionsPanel
        status={status}
        isCreator={isCreator}
        accepting={accepting}
        rejecting={rejecting}
        confirming={confirming}
        disputing={disputing}
        resolving={resolving}
        markingPaid={markingPaid}
        reminding={reminding}
        myDebt={myDebt}
        myCredit={myCredit}
        allPaid={allPaid}
        opponent={{ nick: opponent.nick }}
        onAccept={() => void acceptBet()}
        onReject={() => void rejectBet()}
        onConfirm={() => void confirmResult()}
        onDispute={() => void disputeResult()}
        onMarkPaid={markPaid}
        onRemind={sendReminder}
        onOpenScoreModal={() => setScoreModalOpen(true)}
        paddingBottom={insets.bottom + 12}
      />

      <BetScoreModal
        visible={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        resultType={resultType}
        me={{ id: me.id, nick: me.nick }}
        opponent={{ id: opponent.id, nick: opponent.nick }}
        resolving={resolving}
        onSubmit={submitResult}
      />
    </SafeAreaView>
  );
}

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getStatusBadge(status: BetStatus) {
  if (status === "active" || status === "in_progress")
    return { label: "Aktywny", bg: hexToRgba(Colors.green, 0.15), text: Colors.green, border: hexToRgba(Colors.green, 0.2) };
  if (status === "pending")
    return { label: "Oczekuje", bg: hexToRgba(Colors.amber, 0.15), text: Colors.amber, border: hexToRgba(Colors.amber, 0.2) };
  if (status === "awaiting_confirmation")
    return { label: "Czeka na potwierdzenie", bg: hexToRgba(Colors.textMuted, 0.15), text: Colors.textMuted, border: hexToRgba(Colors.textMuted, 0.2) };
  if (status === "completed")
    return { label: "Zakończony", bg: hexToRgba(Colors.accent, 0.15), text: Colors.accentLight, border: hexToRgba(Colors.accent, 0.2) };
  return { label: "Spór", bg: hexToRgba(Colors.red, 0.15), text: Colors.red, border: hexToRgba(Colors.red, 0.2) };
}
