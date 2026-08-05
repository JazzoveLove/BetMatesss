import { useMemo, useState } from "react";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { EdgeInsets } from "react-native-safe-area-context";
import type { Friendship } from "@/shared/types/user.types";
import type { UserProfile } from "@/shared/types/user.types";
import { Colors } from "@/shared/constants/colors";
import { type BetInviteNotification } from "../../services/notifications.service";
import type { RootStackParamList, TabParamList } from "../../navigation/types";
import { FriendPendingCard } from "./FriendPendingCard";
import { FriendStatCard, friendRowSharedStyles } from "./FriendStatCard";
import { FriendsSearchBar } from "./FriendsSearchBar";
import { InviteQrModal } from "./InviteQrModal";
import { styles } from "./FriendsScreenContent.styles";
import { otherId } from "../../utils/friends/friendsFormatting";
import { InviteCodeCard } from "./InviteCodeCard";
import { AddFriendCard } from "./AddFriendCard";
import { BetInvitesList } from "./BetInvitesList";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
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

  const pendingCards = useMemo(() => {
    const incomingCards = incoming.map((row) => ({
      id: row.id,
      nick: nick(row.userAId),
      status: "pending_received" as const,
      row,
    }));
    const outgoingCards = outgoing.map((row) => ({
      id: row.id,
      nick: nick(row.userBId),
      status: "pending_sent" as const,
      row,
    }));
    return [...incomingCards, ...outgoingCards];
  }, [incoming, nick, outgoing]);

  const filteredActive = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return activeFriends;
    return activeFriends.filter((friend) =>
      friend.nick.toLowerCase().includes(q),
    );
  }, [activeFriends, searchText]);

  const filteredPending = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return pendingCards;
    return pendingCards.filter((item) => item.nick.toLowerCase().includes(q));
  }, [pendingCards, searchText]);

  function openNewBetWithFriend(friend: {
    id: string;
    nick: string;
    avatarUrl?: string;
  }) {
    const preselectedFriend: UserProfile = {
      id: friend.id,
      nick: friend.nick,
      avatarUrl: friend.avatarUrl ?? null,
    };
    navigation.navigate("Tabs", {
      screen: "Nowy",
      params: { preselectedFriend },
    });
  }

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
          <View style={styles.headerActions}>
            <Pressable
              style={styles.searchBtn}
              onPress={() => setSearchOpen((prev) => !prev)}
            >
              <Text style={styles.searchBtnText}>🔍</Text>
            </Pressable>
          </View>
        </View>

        <FriendsSearchBar
          open={searchOpen}
          value={searchText}
          onChangeText={setSearchText}
        />

        <Text style={styles.sectionLabel}>Twój kod</Text>
        <InviteCodeCard me={me} myInviteCode={myInviteCode} onOpenQr={() => setQrOpen(true)} />

        <Text style={styles.sectionLabel}>Dodaj znajomego</Text>
        <AddFriendCard me={me} onAdded={onRefresh} />

        <BetInvitesList invites={betInvites} onAccept={acceptBetInvite} onReject={rejectBetInvite} />

        <Text style={styles.sectionLabel}>
          Twoi rywale — posortowani po liczbie meczów
        </Text>

        <View style={styles.listWrap}>
          {filteredActive.map((friend) => {
            if (friend.totalMatches > 0) {
              return (
                <FriendStatCard
                  key={friend.id}
                  friend={friend}
                  onPress={() =>
                    navigation.navigate("Rivalry", { friendId: friend.id })
                  }
                />
              );
            }
            return (
              <Pressable
                key={friend.id}
                style={friendRowSharedStyles.friendCard}
                onPress={() => openNewBetWithFriend(friend)}
              >
                <View style={friendRowSharedStyles.avatarBubble}>
                  <Text style={friendRowSharedStyles.avatarInitials}>
                    {friend.initials}
                  </Text>
                </View>
                <View style={friendRowSharedStyles.friendMiddle}>
                  <View style={friendRowSharedStyles.friendTopRow}>
                    <Text style={friendRowSharedStyles.friendNick}>
                      {friend.nick}
                    </Text>
                    <View style={styles.playBadge}>
                      <Text style={styles.playBadgeText}>Zagraj!</Text>
                    </View>
                  </View>
                  <Text style={friendRowSharedStyles.friendSub}>
                    Brak meczów · {friend.addedLabel}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {filteredPending.map((item) => (
            <FriendPendingCard
              key={item.id}
              item={item}
              onAccept={accept}
              onReject={reject}
            />
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
