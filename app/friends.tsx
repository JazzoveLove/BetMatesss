import { useState } from 'react'
import { ActivityIndicator, Alert, Share, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard'
import { FriendsScreenContent } from '../components/friends/FriendsScreenContent'
import { Colors } from '../constants/colors'
import { useFriends } from '../hooks/useFriends'

export default function FriendsScreen() {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const {
    loading,
    refreshing,
    me,
    myInviteCode,
    incoming,
    outgoing,
    friends,
    nick,
    onRefresh,
    accept,
    reject,
  } = useFriends()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)

  async function copyInviteLink() {
    if (!me) return
    const link = `betmates://friends?add=${encodeURIComponent(me)}`
    await Clipboard.setStringAsync(link)
    Alert.alert('Schowek', 'Link skopiowany.')
  }

  async function shareInvite() {
    if (!me) return
    const link = `betmates://friends?add=${encodeURIComponent(me)}`
    const lines = ['Dodaj mnie w BetMates', link]
    if (myInviteCode) lines.push(`Kod: ${myInviteCode}`)
    try {
      await Share.share({ message: lines.join('\n'), title: 'BetMates' })
    } catch {
      Alert.alert('Udostępnianie', 'Nie udało się otworzyć menu udostępniania.')
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.accentLight} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
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
        accept={accept}
        reject={reject}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        searchText={searchText}
        setSearchText={setSearchText}
        addModalOpen={addModalOpen}
        setAddModalOpen={setAddModalOpen}
        myInviteCode={myInviteCode}
        copyInviteLink={copyInviteLink}
        shareInvite={shareInvite}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
