import { Alert, Pressable, Text, View } from "react-native";
import { styles } from "./styles/BetDetailHeaderSection.styles";

export type StatusBadge = {
  label: string;
  bg: string;
  text: string;
  border: string;
};

export type BetDetailHeaderSectionProps = {
  paddingTop: number;
  onBack: () => void;
  onDispute: () => void;
  badge: StatusBadge;
  createdAt: string;
};

export function BetDetailHeaderSection({
  paddingTop,
  onBack,
  onDispute,
  badge,
  createdAt,
}: BetDetailHeaderSectionProps) {
  return (
    <>
      <View style={[styles.header, { paddingTop }]}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Text style={styles.iconTxt}>{"<"}</Text>
        </Pressable>
        <Text style={styles.title}>Szczegóły zakładu</Text>
        <Pressable
          style={styles.iconBtn}
          onPress={() =>
            Alert.alert("Akcje", undefined, [
              { text: "Anuluj zakład" },
              { text: "Zgłoś spór", onPress: () => void onDispute() },
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
          {new Date(createdAt).toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </>
  );
}
