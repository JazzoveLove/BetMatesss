import { ActivityIndicator, View } from "react-native";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { FriendsScreenContent } from "../components/FriendsScreenContent";
import { Colors } from "@/shared/constants/colors";
import { useBetInvites } from "@/features/bets";
import { useFriends } from "../hooks/useFriends";
import type { RootStackParamList, TabParamList } from "@/navigation/types";
import { styles } from "./styles/friends.styles";

type FriendsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Znajomi">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function FriendsScreen() {
  const navigation = useNavigation<FriendsNavProp>();
  const insets = useSafeAreaInsets();
  const { betInvites, acceptBetInvite, rejectBetInvite } = useBetInvites();
  const {
    loading,
    refreshing,
    me,
    myInviteCode,
    incoming,
    outgoing,
    friends,
    nick,
    avatar,
    onRefresh,
    accept,
    reject,
  } = useFriends();
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.accentLight} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <FriendsScreenContent
        insets={insets}
        navigation={navigation}
        refreshing={refreshing}
        onRefresh={onRefresh}
        me={me}
        friends={friends}
        incoming={incoming}
        outgoing={outgoing}
        nick={nick}
        avatar={avatar}
        accept={accept}
        reject={reject}
        myInviteCode={myInviteCode}
        betInvites={betInvites}
        acceptBetInvite={acceptBetInvite}
        rejectBetInvite={rejectBetInvite}
      />
    </SafeAreaView>
  );
}
