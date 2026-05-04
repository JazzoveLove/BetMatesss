import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/colors";

export type PlayerCardProps = {
  nick: string;
  initials: string;
  stake: number;
  me: boolean;
};

export function PlayerCard({ nick, initials: initial, stake, me }: PlayerCardProps) {
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: me ? Colors.accent : Colors.cardAlt },
        ]}
      >
        <Text
          style={[
            styles.avatarText,
            { color: me ? Colors.white : Colors.accentLight },
          ]}
        >
          {initial}
        </Text>
      </View>
      <Text style={styles.bodyText}>{nick}</Text>
      <Text style={styles.muted}>{stake > 0 ? `${stake} zł` : "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "700" },
  bodyText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  muted: { color: Colors.textMuted, fontSize: 13 },
});
