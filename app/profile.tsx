import { useMemo, useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '../constants/colors'
import { EditProfileModal } from '../components/profile/EditProfileModal'
import { ProfileActions } from '../components/profile/ProfileActions'
import { ProfileDisciplineList } from '../components/profile/ProfileDisciplineList'
import { ProfileHeader } from '../components/profile/ProfileHeader'
import { ProfileHeroCard } from '../components/profile/ProfileHeroCard'
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton'
import { ProfileStatsRow } from '../components/profile/ProfileStatsRow'
import { StatsSectionCard } from '../components/profile/StatsSectionCard'
import { useProfile } from '../hooks/useProfile'
import { AuthService } from '../services/auth.service'

const ImagePicker: any = require('expo-image-picker')

type Nav = { navigate: (screen: string) => void; replace: (screen: string) => void }

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>()
  const { loading, refreshing, data, onRefresh } = useProfile()

  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [draftNick, setDraftNick] = useState('')
  const [nickOverride, setNickOverride] = useState<string | null>(null)
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null)

  const profile = data
  const displayNick = nickOverride ?? profile?.user.fullName ?? profile?.user.nick ?? '—'
  const displayAvatar = avatarOverride ?? avatarUri ?? profile?.user.avatarUrl ?? null

  const disciplines = useMemo(
    () => [...(profile?.disciplineStats ?? [])].sort((a, b) => b.total - a.total),
    [profile?.disciplineStats],
  )

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Brak dostępu', 'Musisz pozwolić na dostęp do galerii, aby zmienić avatar.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]?.uri) setAvatarUri(result.assets[0].uri)
  }

  function openEditModal() {
    setDraftNick(displayNick)
    setEditOpen(true)
  }

  function applyEdit() {
    const trimmed = draftNick.trim()
    if (trimmed.length < 2) {
      Alert.alert('Za krótki nick', 'Nick musi mieć minimum 2 znaki.')
      return
    }
    setNickOverride(trimmed)
    if (avatarUri) setAvatarOverride(avatarUri)
    setEditOpen(false)
  }

  return (
    <SafeAreaView style={styles.safeTop} edges={['top']}>
      <SafeAreaView style={styles.safeBottom} edges={['bottom']}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          bounces
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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mój profil</Text>
            <View style={styles.headerIcons}>
              <Pressable style={styles.headerIcon}><Text style={styles.headerIconText}>🖼️</Text></Pressable>
              <Pressable style={styles.headerIcon}><Text style={styles.headerIconText}>👤+</Text></Pressable>
            </View>
          </View>

          {loading || !profile ? <ProfileSkeleton /> : (
            <>
              <ProfileHeader
                initials={profile.user.initials}
                displayNick={displayNick}
                memberSince={profile.user.memberSince}
                displayAvatar={displayAvatar}
                onPickAvatar={() => void pickAvatar()}
              />
              <ProfileStatsRow
                totalMatches={profile.stats.totalMatches}
                winRate={profile.stats.winRate}
                balance={profile.stats.balance}
                isBalanceVisible={profile.user.showBalance}
              />
              <ProfileHeroCard
                wins={profile.stats.wins}
                losses={profile.stats.losses}
                disciplines={profile.stats.disciplines}
                friends={profile.stats.friends}
                currentStreak={profile.stats.currentStreak}
              />
              {profile.moneyStats && (
                <StatsSectionCard
                  icon="💰"
                  title="Zakłady na pieniądze"
                  wins={profile.moneyStats.wins}
                  losses={profile.moneyStats.losses}
                  winrate={profile.moneyStats.winRate}
                  balance={profile.moneyStats.balance}
                />
              )}
              {profile.friendlyStats && (
                <StatsSectionCard
                  icon="🤝"
                  title="Mecze towarzyskie"
                  wins={profile.friendlyStats.wins}
                  losses={profile.friendlyStats.losses}
                  winrate={profile.friendlyStats.winRate}
                />
              )}
              <ProfileDisciplineList
                disciplines={disciplines}
                isBalanceVisible={profile.user.showBalance}
              />
              <ProfileActions
                onSettings={() => navigation.navigate('Settings')}
                onEditProfile={openEditModal}
                onLogout={() => void AuthService.signOut()}
              />
            </>
          )}
        </ScrollView>

        <EditProfileModal
          visible={editOpen}
          draftNick={draftNick}
          onChangeNick={setDraftNick}
          onPickAvatar={() => void pickAvatar()}
          onCancel={() => setEditOpen(false)}
          onSave={applyEdit}
        />
      </SafeAreaView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeTop: { flex: 1, backgroundColor: Colors.background },
  safeBottom: { flex: 1, backgroundColor: Colors.background },
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32 },
  header: {
    paddingTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  headerIcons: { flexDirection: 'row', gap: 8 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { color: Colors.text, fontSize: 14, fontWeight: '700' },
})
