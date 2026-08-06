import { Pressable, Text, View } from "react-native";
import { betInviteStyles, styles } from "./FriendsScreenContent.styles";
import type { BetInviteNotification } from "@/shared/services/notifications.service";

type BetInvitesListProps = {
  invites: BetInviteNotification[];
  onAccept: (invite: BetInviteNotification) => Promise<void>;
  onReject: (invite: BetInviteNotification) => Promise<void>;
};

export function BetInvitesList({ invites, onAccept, onReject }: BetInvitesListProps) {
  if (invites.length === 0) return null;
  return (
    <>
      <Text style={styles.sectionLabel}>Zaproszenia do zakładów</Text>
      <View style={styles.listWrap}>
        {invites.map((invite) => (
          <View key={invite.id} style={betInviteStyles.card}>
            <View style={betInviteStyles.top}>
              <View>
                <Text style={betInviteStyles.from}>{invite.fromNick}</Text>
                <Text style={betInviteStyles.game}>{invite.gameTemplate}</Text>
              </View>
              {invite.stakeAmount > 0 && (
                <Text style={betInviteStyles.stake}>{invite.stakeAmount} zł</Text>
              )}
            </View>
            <View style={betInviteStyles.actions}>
              <Pressable style={betInviteStyles.acceptBtn} onPress={() => void onAccept(invite)}>
                <Text style={betInviteStyles.acceptText}>Dołącz</Text>
              </Pressable>
              <Pressable style={betInviteStyles.rejectBtn} onPress={() => void onReject(invite)}>
                <Text style={betInviteStyles.rejectText}>Odrzuć</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}
