import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Colors } from "@/shared/constants/colors";
import { styles } from "./styles/FriendsScreenContent.styles";
import { useAddFriendByCode } from "../hooks/useAddFriendByCode";

type AddFriendCardProps = {
  me: string | null;
  onAdded: () => void;
};

export function AddFriendCard({ me, onAdded }: AddFriendCardProps) {
  const { codeInput, onCodeChange, onSubmit, loading, fieldError, fieldSuccess, disabled } =
    useAddFriendByCode(me, onAdded);

  return (
    <View style={styles.inviteCard}>
      <TextInput
        style={styles.codeInput}
        value={codeInput}
        onChangeText={onCodeChange}
        placeholder="ABCD-EFGH"
        placeholderTextColor={Colors.textFaint}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={9}
        editable={!loading}
      />
      {fieldError ? <Text style={[styles.fieldMessage, styles.fieldError]}>{fieldError}</Text> : null}
      {fieldSuccess ? <Text style={[styles.fieldMessage, styles.fieldSuccess]}>{fieldSuccess}</Text> : null}
      <Pressable
        style={[styles.addBtn, disabled && styles.addBtnDisabled]}
        onPress={onSubmit}
        disabled={disabled}
      >
        {loading ? (
          <ActivityIndicator color={Colors.accentLight} />
        ) : (
          <Text style={[styles.addBtnText, disabled && styles.addBtnTextDisabled]}>Dodaj</Text>
        )}
      </Pressable>
    </View>
  );
}
