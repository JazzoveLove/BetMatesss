import { useMemo, useState } from 'react'
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQueryClient } from '@tanstack/react-query'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/shared/constants/colors'
import { EditProfileModal } from '@/features/profile/components/EditProfileModal'
import { ProfileActions } from '@/features/profile/components/ProfileActions'
import { ProfileDisciplineList } from '@/features/profile/components/ProfileDisciplineList'
import { ProfileHeader } from '@/features/profile/components/ProfileHeader'
import { ProfileHeroCard } from '@/features/profile/components/ProfileHeroCard'
import { ProfileSkeleton } from '@/features/profile/components/ProfileSkeleton'
import { ProfileStatsRow } from '@/features/profile/components/ProfileStatsRow'
import { StatsSectionCard } from '@/features/profile/components/StatsSectionCard'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { useAuthContext } from '@/features/auth'
import { UsersService } from '@/shared/lib/users.service'
import { nickSchema } from '@/shared/utils/user/nickValidation'
import { getFirstValidationError } from '@/shared/utils/validation'
import { queryKeys } from '@/shared/lib/queryKeys'
import { styles } from './styles/profile.styles'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/navigation/types'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>()
  const { loading, refreshing, data, onRefresh } = useProfile()
  const { userId } = useAuthContext()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [draftNick, setDraftNick] = useState('')
  const [nickOverride, setNickOverride] = useState<string | null>(null)

  const profile = data
  const displayNick = nickOverride ?? profile?.user.fullName ?? profile?.user.nick ?? '—'
  const displayAvatar = profile?.user.avatarUrl ?? null

  const disciplines = useMemo(
    () => [...(profile?.disciplineStats ?? [])].sort((a, b) => b.total - a.total),
    [profile?.disciplineStats],
  )

  function openEditModal() {
    setDraftNick(displayNick)
    setEditOpen(true)
  }

  async function applyEdit() {
    const trimmed = draftNick.trim()
    const validationError = getFirstValidationError(nickSchema.safeParse(trimmed))
    if (validationError) {
      Alert.alert('Nieprawidłowy nick', validationError)
      return
    }
    if (!userId) return

    const result = await UsersService.updateNick(userId, trimmed)
    if (result.error) {
      if (result.code === '23505') {
        Alert.alert('Nick zajęty', 'Ten nick jest już używany. Wybierz inny.')
      } else {
        Alert.alert('Błąd zapisu', result.error)
      }
      return
    }

    setNickOverride(trimmed)
    setEditOpen(false)
    queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) })
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
          </View>

          {loading || !profile ? <ProfileSkeleton /> : (
            <>
              <ProfileHeader
                initials={profile.user.initials}
                displayNick={displayNick}
                memberSince={profile.user.memberSince}
                displayAvatar={displayAvatar}
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
              />
              {profile.moneyStats && (
                <StatsSectionCard
                  icon="trophy-outline"
                  title="Zakłady na punkty"
                  wins={profile.moneyStats.wins}
                  losses={profile.moneyStats.losses}
                  winrate={profile.moneyStats.winRate}
                  balance={profile.moneyStats.balance}
                />
              )}
              {profile.friendlyStats && (
                <StatsSectionCard
                  icon="people-outline"
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
              />
            </>
          )}
        </ScrollView>

        <EditProfileModal
          visible={editOpen}
          draftNick={draftNick}
          onChangeNick={setDraftNick}
          onCancel={() => setEditOpen(false)}
          onSave={applyEdit}
        />
      </SafeAreaView>
    </SafeAreaView>
  )
}
