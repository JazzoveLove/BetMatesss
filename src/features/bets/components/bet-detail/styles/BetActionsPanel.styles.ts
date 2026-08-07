import { StyleSheet } from "react-native";
import { Colors } from "@/shared/constants/colors";
import { hexToRgba } from "@/shared/utils/colors";

export const styles = StyleSheet.create({
  bottomActions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: hexToRgba(Colors.background, 0.95),
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  gap8: { gap: 8 },
  primaryAction: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  secondaryAction: {
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectText: { color: Colors.red, fontSize: 14, fontWeight: "600" },
  rejectedText: { color: Colors.red, textAlign: "center", fontWeight: "600" },
  muted: { color: Colors.textMuted, fontSize: 13 },
  allPaidText: { color: Colors.green, textAlign: "center" },
});
