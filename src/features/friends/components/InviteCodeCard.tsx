import { Pressable, Text, View, Alert, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useToast } from "@/shared/components/Toast";
import { styles } from "./styles/FriendsScreenContent.styles";
import { formatInviteCodeDisplay } from "../utils/friendsFormatting";

type InviteCodeCardProps = {
  me: string | null;
  myInviteCode: string | null;
  onOpenQr: () => void;
};

export function InviteCodeCard({ me, myInviteCode, onOpenQr }: InviteCodeCardProps) {
  const { showToast } = useToast();

  async function copyMyCode() {
    if (!myInviteCode) return;
    await Clipboard.setStringAsync(myInviteCode);
    showToast("Skopiowano");
  }

  async function shareInvite() {
    if (!me || !myInviteCode) return;
    const link = `betmates://friends?add=${me}`;
    const message = ["Dodaj mnie w BetMates", link, `Kod: ${myInviteCode}`].join("\n");
    try {
      await Share.share({ message, title: "BetMates" });
    } catch {
      Alert.alert("Udostępnianie", "Nie udało się otworzyć menu udostępniania.");
    }
  }

  return (
    <View style={styles.inviteCard}>
      {myInviteCode ? (
        <Text style={[styles.inviteCodeDisplay, styles.inviteCodeMono]}>
          {formatInviteCodeDisplay(myInviteCode)}
        </Text>
      ) : (
        <Text style={styles.loadingCode}>ładowanie…</Text>
      )}
      <View style={styles.rowBtns}>
        <Pressable
          style={[styles.smallBtn, !myInviteCode && { opacity: 0.5 }]}
          onPress={copyMyCode}
          disabled={!myInviteCode}
        >
          <Text style={styles.smallBtnText}>Kopiuj</Text>
        </Pressable>
        <Pressable
          style={[styles.smallBtn, !me && { opacity: 0.5 }]}
          onPress={onOpenQr}
          disabled={!me}
        >
          <Text style={styles.smallBtnText}>QR</Text>
        </Pressable>
      </View>
      <Pressable
        style={[styles.shareBtn, (!me || !myInviteCode) && { opacity: 0.5 }]}
        onPress={shareInvite}
        disabled={!me || !myInviteCode}
      >
        <Text style={styles.shareBtnText}>Udostępnij</Text>
      </Pressable>
    </View>
  );
}
