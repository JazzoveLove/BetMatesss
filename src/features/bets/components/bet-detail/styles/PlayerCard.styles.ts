import { StyleSheet } from "react-native";
import { Colors } from "@/shared/constants/colors";

export const styles = StyleSheet.create({
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
