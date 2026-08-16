import { useMemo, useState } from "react";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import type { EdgeInsets } from "react-native-safe-area-context";
import type { Friendship } from "@/features/friends/types/friendship.types";
import { Colors } from "@/shared/constants/colors";
import { type BetInviteNotification } from "@/shared/lib/notifications.service";
import type { RootStackParamList, TabParamList } from "@/navigation/types";
import { FriendPendingCard } from "./FriendPendingCard";
import { FriendRowCard } from "./FriendRowCard";
import { InviteQrModal } from "./InviteQrModal";
import { styles } from "./styles/FriendsScreenContent.styles";
import { otherId } from "../utils/friendsFormatting";
import { InviteCodeCard } from "./InviteCodeCard";
import { AddFriendCard } from "./AddFriendCard";

type FriendsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Znajomi">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type FriendsScreenContentProps = {
  insets: EdgeInsets;
  navigation: FriendsNavProp;
  refreshing: boolean;
  onRefresh: () => void;
  me: string | null;
  friends: Friendship[];
  incoming: Friendship[];
  outgoing: Friendship[];
  nick: (id: string) => string;
  avatar: (id: string) => string | null;
  accept: (row: Friendship) => void | Promise<void>;
  reject: (row: Friendship) => void | Promise<void>;
  myInviteCode: string | null;
  betInvites: BetInviteNotification[];
  acceptBetInvite: (invite: BetInviteNotification) => Promise<void>;
  rejectBetInvite: (invite: BetInviteNotification) => Promise<void>;
};

export function FriendsScreenContent({
  insets,
  navigation,
  refreshing,
  onRefresh,
  me,
  friends,
  incoming,
  outgoing,
  nick,
  avatar,
  accept,
  reject,
  myInviteCode,
  betInvites,
  acceptBetInvite,
  rejectBetInvite,
}: FriendsScreenContentProps) {
  const [qrOpen, setQrOpen] = useState(false);

  const activeFriends = useMemo(() => {
    return friends
      .map((row) => {
        const id = me ? otherId(row, me) : "";
        const friendNick = nick(id);
        const words = friendNick.trim().split(/\s+/).filter(Boolean);
        const initials =
          words.length > 1
            ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
            : friendNick.slice(0, 2).toUpperCase();
        return {
          id,
          nick: friendNick,
          initials: initials || "?",
          avatarUrl: avatar(id) ?? undefined,
          totalMatches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          balance: 0,
          lastActivityLabel: "brak",
          status: "new" as const,
          addedLabel: "dodany niedawno",
        };
      })
      .sort((a, b) => b.totalMatches - a.totalMatches);
  }, [friends, me, nick, avatar]);

  const incomingCards = useMemo(() => {
    return incoming.map((row) => ({
      id: row.id,
      nick: nick(row.userAId),
      status: "pending_received" as const,
      row,
    }));
  }, [incoming, nick]);

  const outgoingFriends = useMemo(() => {
    return outgoing.map((row) => {
      const id = me ? otherId(row, me) : "";
      const friendNick = nick(id);
      const words = friendNick.trim().split(/\s+/).filter(Boolean);
      const initials =
        words.length > 1
          ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
          : friendNick.slice(0, 2).toUpperCase();
      return {
        id: row.id,
        nick: friendNick,
        initials: initials || "?",
        avatarUrl: avatar(id) ?? undefined,
      };
    });
  }, [outgoing, me, nick, avatar]);

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        bounces
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentLight}
            colors={[Colors.accentLight]}
          />
        }
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Znajomi</Text>
        </View>

        <Text style={styles.sectionLabel}>Twój kod</Text>
        <InviteCodeCard me={me} myInviteCode={myInviteCode} onOpenQr={() => setQrOpen(true)} />

        <Text style={styles.sectionLabel}>Dodaj znajomego</Text>
        <AddFriendCard me={me} onAdded={onRefresh} />

        {incomingCards.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Zaproszenia do Ciebie</Text>
            <View style={styles.listWrap}>
              {incomingCards.map((item) => (
                <FriendPendingCard
                  key={item.id}
                  item={item}
                  onAccept={accept}
                  onReject={reject}
                />
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Twoi znajomi</Text>

        <View style={styles.listWrap}>
          {activeFriends.map((friend) => (
            <FriendRowCard
              key={friend.id}
              friend={friend}
              onPress={() => navigation.navigate("FriendDetail", { friendId: friend.id })}
            />
          ))}

          {outgoingFriends.map((item) => (
            <FriendRowCard key={item.id} friend={item} sent />
          ))}
        </View>
      </ScrollView>

      <InviteQrModal
        visible={qrOpen}
        onClose={() => setQrOpen(false)}
        userId={me}
      />
    </>
  );
}