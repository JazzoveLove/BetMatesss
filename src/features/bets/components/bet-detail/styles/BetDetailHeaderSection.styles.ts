import { StyleSheet } from "react-native";
import { Colors } from "@/shared/constants/colors";

export const styles = StyleSheet.create({
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
