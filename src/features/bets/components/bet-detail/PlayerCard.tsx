import { Text, View } from "react-native";
import { Colors } from "@/shared/constants/colors";
import { styles } from "./styles/PlayerCard.styles";

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
      <Text style={styles.muted}>{stake > 0 ? `${stake} j.` : "—"}</Text>
    </View>
  );
}
