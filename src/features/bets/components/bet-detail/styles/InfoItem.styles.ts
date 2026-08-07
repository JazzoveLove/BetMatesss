import { StyleSheet } from "react-native";
import { Colors } from "@/shared/constants/colors";

export const styles = StyleSheet.create({
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
