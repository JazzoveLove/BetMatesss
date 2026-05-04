import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Colors } from "../../constants/colors";
import type {
  BetDetail,
  BetParticipant,
  BetStatus,
  Settlement,
} from "../../types/bet.types";
import type { ScoreState } from "./BetScoreModal";
import { InfoItem } from "./InfoItem";
import { PlayerCard } from "./PlayerCard";
import { styles } from "../../app/bet-detail.styles";

export type BetDetailScrollBodyProps = {
  me: BetParticipant;
  opponent: BetParticipant;
  meInitials: string;
  opponentInitials: string;
  game: { emoji: string; label: string };
  bet: BetDetail;
  totalPool: number | null;
  scoreState: ScoreState;
  winnerId: string | null;
  status: BetStatus;
  settlements: Settlement[];
  currentUserId: string | null;
  chatInput: string;
  setChatInput: (s: string) => void;
};

export function BetDetailScrollBody({
  me,
  opponent,
  meInitials,
  opponentInitials,
  game,
  bet,
  totalPool,
  scoreState,
  winnerId,
  status,
  settlements,
  currentUserId,
  chatInput,
  setChatInput,
}: BetDetailScrollBodyProps) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.vsRow}>
          <PlayerCard
            nick={me.nick}
            initials={meInitials}
            stake={me.stakeAmount}
            me
          />
          <Text style={styles.muted}>VS</Text>
          <PlayerCard
            nick={opponent.nick}
            initials={opponentInitials}
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
  );
}
