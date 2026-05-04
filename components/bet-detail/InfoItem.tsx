import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/colors";

export type InfoItemProps = {
  label: string;
  value: string;
  valueColor?: string;
};

export function InfoItem({
  label,
  value,
  valueColor = Colors.text,
}: InfoItemProps) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center" },
  value: { fontSize: 13, fontWeight: "600" },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
  },
});
