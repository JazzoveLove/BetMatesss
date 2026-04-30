import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '../constants/colors'
import { useProfile } from '../hooks/useProfile'
import { AuthService } from '../services/auth.service'
import { hexToRgba } from '../utils/colors'

const ImagePicker: any = require('expo-image-picker')

type Nav = {
  navigate: (screen: string) => void
  replace: (screen: string) => void
}

function formatBalance(value: number): string {
  if (value > 0) return `+${value} zł`
  if (value < 0) return `${value} zł`
  return '0 zł'
}

function getBalanceColor(value: number): string {
  if (value > 0) return Colors.green
  if (value < 0) return Colors.red
  return Colors.textMuted
}

function getWinRateColor(rate: number): string {
  if (rate >= 60) return Colors.green
  if (rate >= 40) return Colors.amber
  return Colors.red
}

function Skeleton({ height }: { height: number }) {
  return <View style={[styles.skeleton, { height }]} />
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>()
  const { loading, refreshing, data, onRefresh } = useProfile()

  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [draftNick, setDraftNick] = useState('')
  const [nickOverride, setNickOverride] = useState<string | null>(null)
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null)
  const winProgress = useRef(new Animated.Value(0)).current

  const profile = data
  const displayNick = nickOverride ?? profile?.user.fullName ?? profile?.user.nick ?? '—'
  const displayAvatar = avatarOverride ?? avatarUri ?? profile?.user.avatarUrl ?? null

  const disciplines = useMemo(
    () => [...(profile?.disciplineStats ?? [])].sort((a, b) => b.total - a.total),
    [profile?.disciplineStats],
  )

  const wins = profile?.stats.wins ?? 0
  const losses = profile?.stats.losses ?? 0
  const totalWL = Math.max(1, wins + losses)
  const winRatio = wins / totalWL

  useEffect(() => {
    Animated.timing(winProgress, {
      toValue: winRatio,
      duration: 600,
      useNativeDriver: false,
    }).start()
  }, [winProgress, winRatio])

  useEffect(() => {
    if (!profile) return
    setDraftNick(profile.user.nick)
  }, [profile])

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
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri)
    }
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

  function onLogout() {
    Alert.alert('Wylogowanie', 'Czy na pewno chcesz się wylogować?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Wyloguj',
        style: 'destructive',
        onPress: () => {
          void AuthService.signOut().finally(() => navigation.replace('Login'))
        },
      },
    ])
  }

  const isBalanceVisible = profile?.user.showBalance ?? true
  const globalBalanceText = !isBalanceVisible ? '—' : formatBalance(profile?.stats.balance ?? 0)
  const globalBalanceColor = !isBalanceVisible ? Colors.textMuted : getBalanceColor(profile?.stats.balance ?? 0)

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
              <Pressable style={styles.headerIcon}>
                <Text style={styles.headerIconText}>🖼️</Text>
              </Pressable>
              <Pressable style={styles.headerIcon}>
                <Text style={styles.headerIconText}>👤+</Text>
              </Pressable>
            </View>
          </View>

          {loading || !profile ? (
            <View>
              <View style={styles.avatarSection}>
                <Skeleton height={80} />
                <View style={{ marginTop: 12 }}><Skeleton height={24} /></View>
                <View style={{ marginTop: 4 }}><Skeleton height={16} /></View>
              </View>
              <View style={styles.statsRow}>
                <Skeleton height={72} />
                <Skeleton height={72} />
                <Skeleton height={72} />
              </View>
              <View style={styles.heroCard}><Skeleton height={160} /></View>
            </View>
          ) : (
            <>
              <View style={styles.avatarSection}>
                <Pressable style={styles.avatar} onPress={() => void pickAvatar()}>
                  {displayAvatar ? (
                    <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{profile.user.initials}</Text>
                  )}
                </Pressable>
                <Text style={styles.nick}>{displayNick}</Text>
                <Text style={styles.memberSince}>w BetMates od {profile.user.memberSince}</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{profile.stats.totalMatches}</Text>
                  <Text style={styles.statLabel}>MECZE</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{profile.stats.winRate}%</Text>
                  <Text style={styles.statLabel}>WIN RATE</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: globalBalanceColor }]}>{globalBalanceText}</Text>
                  <Text style={styles.statLabel}>BILANS</Text>
                </View>
              </View>

              <View style={styles.heroCard}>
                <Text style={styles.heroScore}>
                  <Text style={{ color: Colors.green }}>{wins}W</Text>
                  <Text style={{ color: Colors.textMuted }}> / {losses}P</Text>
                </Text>
                <Text style={styles.heroLabel}>WSZYSTKIE MECZE ŁĄCZNIE</Text>
                <View style={styles.heroTrack}>
                  <Animated.View
                    style={[
                      styles.heroWin,
                      {
                        width: winProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                  <View style={[styles.heroLoss, { flex: Math.max(0, 1 - winRatio) }]} />
                </View>
                <View style={styles.heroBottom}>
                  <View style={styles.heroMetric}>
                    <Text style={styles.heroMetricValue}>{profile.stats.disciplines}</Text>
                    <Text style={styles.heroMetricLabel}>DYSCYPLINY</Text>
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroMetric}>
                    <Text style={styles.heroMetricValue}>{profile.stats.friends}</Text>
                    <Text style={styles.heroMetricLabel}>ZNAJOMI</Text>
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroMetric}>
                    <Text style={styles.heroMetricValue}>
                      {profile.stats.currentStreak > 0 ? profile.stats.currentStreak : '—'}
                    </Text>
                    <Text style={styles.heroMetricLabel}>SERIA W.</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionLabel}>WYNIKI PER DYSCYPLINA</Text>
              {disciplines.map(item => {
                const shownBalance = !isBalanceVisible ? '—' : !item.hasStake ? 'bez stawki' : formatBalance(item.balance)
                const balanceColor = !isBalanceVisible
                  ? Colors.textMuted
                  : !item.hasStake
                    ? Colors.textMuted
                    : getBalanceColor(item.balance)
                return (
                  <View key={item.gameId} style={styles.disciplineCard}>
                    <View style={styles.emojiBox}>
                      <Text style={styles.emojiText}>{item.gameEmoji}</Text>
                    </View>
                    <View style={styles.disciplineMiddle}>
                      <View style={styles.disciplineTop}>
                        <Text style={styles.disciplineName}>{item.gameName}</Text>
                        <Text style={[styles.disciplineRate, { color: getWinRateColor(item.winRate) }]}>
                          {item.winRate}%
                        </Text>
                      </View>
                      <View style={styles.disciplineTrack}>
                        <View style={[styles.disciplineWin, { flex: item.wins }]} />
                        <View style={[styles.disciplineLoss, { flex: item.losses }]} />
                      </View>
                      <View style={styles.disciplineBottom}>
                        <Text style={styles.disciplineMeta}>{item.wins}W {item.losses}P</Text>
                        <Text style={[styles.disciplineBalance, { color: balanceColor }]}>
                          {shownBalance}
                        </Text>
                        <Text style={styles.disciplineMeta}>{item.total} meczów</Text>
                      </View>
                    </View>
                  </View>
                )
              })}

              <View style={styles.actionsRow}>
                <Pressable style={styles.actionButton} onPress={() => navigation.navigate('Settings')}>
                  <Text style={styles.actionText}>⚙️ Ustawienia</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={openEditModal}>
                  <Text style={styles.actionEditText}>✏️ Edytuj profil</Text>
                </Pressable>
                <Pressable style={styles.logoutButton} onPress={onLogout}>
                  <Text style={styles.logoutText}>Wyloguj</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>

        <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edytuj profil</Text>
              <Pressable style={styles.modalAvatarButton} onPress={() => void pickAvatar()}>
                <Text style={styles.modalAvatarText}>📷 Zmień avatar</Text>
              </Pressable>
              <TextInput
                value={draftNick}
                onChangeText={setDraftNick}
                placeholder="Nick"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
              <View style={styles.modalActions}>
                <Pressable style={styles.modalAction} onPress={() => setEditOpen(false)}>
                  <Text style={styles.modalActionText}>Anuluj</Text>
                </Pressable>
                <Pressable style={styles.modalAction} onPress={applyEdit}>
                  <Text style={styles.modalActionText}>Zapisz</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  avatarSection: { alignItems: 'center', marginTop: 20, marginBottom: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: Colors.white, fontSize: 28, fontWeight: '700' },
  nick: { marginTop: 12, color: Colors.text, fontSize: 20, fontWeight: '700' },
  memberSince: { marginTop: 4, color: Colors.textMuted, fontSize: 13 },
  statsRow: { marginHorizontal: 16, flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingVertical: 12,
  },
  statValue: { color: Colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  statLabel: {
    marginTop: 4,
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
  heroScore: { color: Colors.text, fontSize: 36, fontWeight: '700' },
  heroLabel: { marginTop: 4, color: Colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  heroTrack: {
    marginTop: 12,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.red,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  heroWin: { height: 5, backgroundColor: Colors.green },
  heroLoss: { backgroundColor: Colors.red },
  heroBottom: { marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  heroMetric: { flex: 1, alignItems: 'center', gap: 4 },
  heroDivider: { width: 1, height: 36, backgroundColor: Colors.borderSoft },
  heroMetricValue: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  heroMetricLabel: { color: Colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  sectionLabel: {
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 12,
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  disciplineCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
    flexDirection: 'row',
  },
  emojiBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 24 },
  disciplineMiddle: { flex: 1, marginLeft: 12 },
  disciplineTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disciplineName: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  disciplineRate: { fontSize: 15, fontWeight: '700' },
  disciplineTrack: {
    marginTop: 8,
    marginBottom: 8,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: Colors.red,
    flexDirection: 'row',
  },
  disciplineWin: { backgroundColor: Colors.green },
  disciplineLoss: { backgroundColor: Colors.red },
  disciplineBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disciplineMeta: { color: Colors.textMuted, fontSize: 12 },
  disciplineBalance: { fontSize: 12, fontWeight: '600' },
  actionsRow: { marginHorizontal: 16, marginTop: 16, marginBottom: 32, flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionText: { color: Colors.text, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  actionEditText: { color: Colors.accentLight, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  logoutButton: {
    flex: 1,
    backgroundColor: hexToRgba(Colors.red, 0.12),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.red, 0.3),
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: { color: Colors.red, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  skeleton: { width: '100%', borderRadius: 12, backgroundColor: Colors.cardAlt },
  modalOverlay: {
    flex: 1,
    backgroundColor: hexToRgba(Colors.background, 0.7),
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalAvatarButton: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatarText: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: 12,
    color: Colors.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  modalActions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  modalAction: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalActionText: { color: Colors.text, fontSize: 13, fontWeight: '700' },
})
