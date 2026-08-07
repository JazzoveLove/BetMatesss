import { StyleSheet } from "react-native";
import { Colors } from "@/shared/constants/colors";
import { hexToRgba } from "@/shared/utils/colors";

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: hexToRgba(Colors.background, 0.55),
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: hexToRgba(Colors.white, 0.2),
    marginBottom: 16,
  },
  sheetTitle: { color: Colors.text, fontWeight: "700", fontSize: 17 },
  scoringLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 12,
    marginBottom: 6,
  },
  scoreInputs: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bigInput: {
    flex: 1,
    height: 80,
    borderRadius: 14,
    backgroundColor: Colors.cardAlt,
    color: Colors.text,
    fontSize: 40,
    textAlign: "center",
    fontWeight: "700",
  },
  muted: { color: Colors.textMuted, fontSize: 13 },
  winnerOnlyGap: { gap: 8 },
  bodyText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
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
  selectedAction: {
    borderColor: Colors.accent,
    backgroundColor: hexToRgba(Colors.accent, 0.15),
  },
});
