import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/colors";

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

const styles = StyleSheet.create({
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
  muted: { color: Colors.textMuted, fontSize: 13 },
});
