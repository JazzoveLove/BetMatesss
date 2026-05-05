import { useMemo, useState } from "react";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import type { EdgeInsets } from "react-native-safe-area-context";
import type { Friendship } from "../../types/user.types";
import type { UserProfile } from "../../types/user.types";
import { Colors } from "../../constants/colors";
import { hexToRgba } from "../../utils/colors";
import {
  handleFriendInvite,
  lookupUserByCode,
} from "../../services/friends/friends.invite";
import { type BetInviteNotification } from "../../services/notifications.service";
import type { RootStackParamList, TabParamList } from "../../navigation/types";
import { FriendPendingCard } from "./FriendPendingCard";
import { FriendStatCard, friendRowSharedStyles } from "./FriendStatCard";
import { FriendsSearchBar } from "./FriendsSearchBar";
import { InviteQrModal } from "./InviteQrModal";

type FriendsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Znajomi">,
  NativeStackNavigationProp<RootStackParamList>
>;

function otherId(row: Friendship, me: string): string {
  return row.userAId === me ? row.userBId : row.userAId;
}

function formatInviteCodeDisplay(code: string): string {
  if (code.length <= 4) return code;
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

function formatCodeInputField(raw: string): string {
  const cleaned = raw
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

function inviteResultSuccessMessage(
  type: "sent" | "accepted" | "already_friends" | "already_sent",
): string {
  switch (type) {
    case "sent":
      return "Zaproszenie zostało wysłane.";
    case "accepted":
      return "Jesteście teraz znajomymi.";
    case "already_friends":
      return "Ta osoba jest już na liście znajomych.";
    case "already_sent":
      return "Zaproszenie już czeka na akceptację.";
  }
}

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
  accept: (row: Friendship) => void | Promise<void>;
  reject: (row: Friendship) => void | Promise<void>;
  myInviteCode: string | null;
  betInvites: BetInviteNotification[];
  acceptBetInvite: (invite: BetInviteNotification) => Promise<void>;
  rejectBetInvite: (invite: BetInviteNotification) => Promise<void>;
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32 },
  header: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: Colors.text, fontSize: 20, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 8 },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: { color: Colors.textMuted, fontSize: 14 },
  sectionLabel: {
    marginLeft: 16,
    marginBottom: 12,
    marginTop: 8,
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  listWrap: { paddingHorizontal: 16, gap: 8 },
  playBadge: {
    backgroundColor: hexToRgba(Colors.amber, 0.15),
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  playBadgeText: { color: Colors.amber, fontSize: 12, fontWeight: "700" },
  inviteCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
  inviteCodeDisplay: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 16,
  },
  inviteCodeMono: { fontFamily: "monospace" },
  loadingCode: {
    color: Colors.textMuted,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  rowBtns: { flexDirection: "row", gap: 8, marginBottom: 10 },
  smallBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.cardAlt,
    alignItems: "center",
  },
  smallBtnText: { color: Colors.accentLight, fontSize: 14, fontWeight: "600" },
  shareBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center",
  },
  shareBtnText: { color: Colors.white, fontSize: 15, fontWeight: "700" },
  codeInput: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 18,
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  fieldMessage: { marginTop: 8, fontSize: 13 },
  fieldError: { color: Colors.red },
  fieldSuccess: { color: Colors.green },
  addBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  addBtnDisabled: { backgroundColor: Colors.cardAlt, opacity: 0.6 },
  addBtnText: { color: Colors.white, fontSize: 15, fontWeight: "700" },
  addBtnTextDisabled: { color: Colors.textMuted },
});

const betInviteStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.accent, 0.3),
    padding: 16,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  from: { color: Colors.text, fontSize: 15, fontWeight: "700" },
  game: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  stake: { color: Colors.accentLight, fontSize: 16, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8 },
  acceptBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: hexToRgba(Colors.green, 0.15),
    alignItems: "center",
  },
  acceptText: { color: Colors.green, fontSize: 13, fontWeight: "700" },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: hexToRgba(Colors.red, 0.15),
    alignItems: "center",
  },
  rejectText: { color: Colors.red, fontSize: 13, fontWeight: "700" },
});

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
  const [addCodeInput, setAddCodeInput] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addFieldError, setAddFieldError] = useState<string | null>(null);
  const [addFieldSuccess, setAddFieldSuccess] = useState<string | null>(null);

  const codeWithoutDash = addCodeInput.replace(/-/g, "");
  const addDisabled = codeWithoutDash.length < 6 || !me || addLoading;

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
          avatarUrl: undefined as string | undefined,
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
  }, [friends, me, nick]);

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

  async function copyMyCode() {
    if (!myInviteCode) return;
    await Clipboard.setStringAsync(myInviteCode);
    Alert.alert("Schowek", "Kod skopiowany.");
  }

  async function shareInvite() {
    if (!me || !myInviteCode) return;
    const link = `betmates://friends?add=${me}`;
    const message = [
      "Dodaj mnie w BetMates",
      link,
      `Kod: ${myInviteCode}`,
    ].join("\n");
    try {
      await Share.share({ message, title: "BetMates" });
    } catch {
      Alert.alert(
        "Udostępnianie",
        "Nie udało się otworzyć menu udostępniania.",
      );
    }
  }

  function onCodeChange(text: string) {
    setAddFieldError(null);
    setAddFieldSuccess(null);
    setAddCodeInput(formatCodeInputField(text));
  }

  async function onAddFriend() {
    if (!me || addDisabled) return;
    setAddFieldError(null);
    setAddFieldSuccess(null);
    setAddLoading(true);
    try {
      const lookup = await lookupUserByCode(codeWithoutDash);
      if ("error" in lookup) {
        if (lookup.missingFunction) {
          setAddFieldError(
            "Uruchom w Supabase skrypt z pliku supabase/users_invite_code.sql.",
          );
        } else if (lookup.error === "not_found") {
          setAddFieldError("Nie znaleziono użytkownika o tym kodzie.");
        } else {
          setAddFieldError(lookup.error);
        }
        return;
      }
      const result = await handleFriendInvite(me, lookup.userId);
      if (
        result.type === "sent" ||
        result.type === "accepted" ||
        result.type === "already_friends" ||
        result.type === "already_sent"
      ) {
        setAddFieldSuccess(inviteResultSuccessMessage(result.type));
        setAddCodeInput("");
        onRefresh();
        return;
      }
      if (result.type === "self") {
        setAddFieldError("Nie możesz dodać samego siebie.");
        return;
      }
      if (result.type === "not_found") {
        setAddFieldError("Nie znaleziono użytkownika.");
        return;
      }
      if (result.type === "missing_function") {
        setAddFieldError("Brak funkcji w bazie. Uruchom skrypt SQL.");
        return;
      }
      if (result.type === "duplicate") {
        setAddFieldError("Taka relacja jest już zapisana.");
        return;
      }
      if (result.type === "error") {
        setAddFieldError(result.message);
        return;
      }
    } catch {
      setAddFieldError("Nie udało się dodać znajomego. Spróbuj ponownie.");
    } finally {
      setAddLoading(false);
    }
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
              onPress={() => setQrOpen(true)}
              disabled={!me}
            >
              <Text style={styles.smallBtnText}>QR</Text>
            </Pressable>
          </View>
          <Pressable
            style={[
              styles.shareBtn,
              (!me || !myInviteCode) && { opacity: 0.5 },
            ]}
            onPress={shareInvite}
            disabled={!me || !myInviteCode}
          >
            <Text style={styles.shareBtnText}>Udostępnij</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Dodaj znajomego</Text>
        <View style={styles.inviteCard}>
          <TextInput
            style={styles.codeInput}
            value={addCodeInput}
            onChangeText={onCodeChange}
            placeholder="ABC-DEFGH"
            placeholderTextColor={Colors.textFaint}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={9}
            editable={!addLoading}
          />
          {addFieldError ? (
            <Text style={[styles.fieldMessage, styles.fieldError]}>
              {addFieldError}
            </Text>
          ) : null}
          {addFieldSuccess ? (
            <Text style={[styles.fieldMessage, styles.fieldSuccess]}>
              {addFieldSuccess}
            </Text>
          ) : null}
          <Pressable
            style={[styles.addBtn, addDisabled && styles.addBtnDisabled]}
            onPress={onAddFriend}
            disabled={addDisabled}
          >
            {addLoading ? (
              <ActivityIndicator color={Colors.accentLight} />
            ) : (
              <Text
                style={[
                  styles.addBtnText,
                  addDisabled && styles.addBtnTextDisabled,
                ]}
              >
                Dodaj
              </Text>
            )}
          </Pressable>
        </View>

        {betInvites.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Zaproszenia do zakładów</Text>
            <View style={styles.listWrap}>
              {betInvites.map((invite) => (
                <View key={invite.id} style={betInviteStyles.card}>
                  <View style={betInviteStyles.top}>
                    <View>
                      <Text style={betInviteStyles.from}>{invite.fromNick}</Text>
                      <Text style={betInviteStyles.game}>{invite.gameTemplate}</Text>
                    </View>
                    {invite.stakeAmount > 0 && (
                      <Text style={betInviteStyles.stake}>
                        {invite.stakeAmount} zł
                      </Text>
                    )}
                  </View>
                  <View style={betInviteStyles.actions}>
                    <Pressable
                      style={betInviteStyles.acceptBtn}
                      onPress={() => void acceptBetInvite(invite)}
                    >
                      <Text style={betInviteStyles.acceptText}>Dołącz</Text>
                    </Pressable>
                    <Pressable
                      style={betInviteStyles.rejectBtn}
                      onPress={() => void rejectBetInvite(invite)}
                    >
                      <Text style={betInviteStyles.rejectText}>Odrzuć</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

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
