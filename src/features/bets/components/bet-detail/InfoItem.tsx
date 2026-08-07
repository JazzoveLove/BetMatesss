import { Text, View } from "react-native";
import { Colors } from "@/shared/constants/colors";
import { styles } from "./styles/InfoItem.styles";

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
