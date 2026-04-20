import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Share, Alert, ActivityIndicator, RefreshControl, TextInput } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useFriends } from '../hooks/useFriends'
import type { FriendshipRow } from '../types/user.types'

function otherId(row: FriendshipRow, me: string): string {
  return row.user_a === me ? row.user_b : row.user_a
}

export default function FriendsScreen() {
  const {
    loading, refreshing, me, myInviteCode,
    incoming, outgoing, friends, nick,
    codeInput, setCodeInput, sendingCode,
    nickSearch, nickResults, searchingNick,
    betInvites,
    onRefresh, accept, reject, submitCode, searchNick,
    handleInviteFromLink,
    acceptBetInvite, rejectBetInvite,
  } = useFriends()

  async function copyInviteLink() {
    if (!me) return
    const link = `betmates://friends?add=${encodeURIComponent(me)}`
    await Clipboard.setStringAsync(link)
    Alert.alert('Schowek', 'Link skopiowany.')
  }

  async function copyInviteCode() {
    if (!myInviteCode) return
    await Clipboard.setStringAsync(myInviteCode)
    Alert.alert('Schowek', 'Kod skopiowany.')
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
      <View style={styles.centered}>
        <ActivityIndicator color="#7F77DD" size="large" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7F77DD" colors={['#7F77DD']} />
      }
    >
      <Text style={styles.title}>Znajomi</Text>
      <Text style={styles.subtitle}>
        Ranking — wkrótce. Zaproś linkiem, kodem albo znajdź osobę po nicku.
      </Text>

      {/* Invite card */}
      <View style={styles.inviteCard}>
        <Text style={styles.inviteTitle}>Zaproś znajomego</Text>
        <Text style={styles.inviteDesc}>
          Link działa po kliknięciu w telefonie. Kod możesz wysłać SMS-em lub messengera.
        </Text>

        {myInviteCode ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Twój kod</Text>
            <Text style={styles.codeValue}>{myInviteCode}</Text>
          </View>
        ) : (
          <Text style={styles.codeHint}>
            Po dodaniu kolumny w bazie (skrypt users_invite_code.sql) pojawi się tu kod.
          </Text>
        )}

        <View style={styles.inviteActions}>
          <TouchableOpacity style={[styles.inviteBtn, styles.inviteBtnFlex]} onPress={shareInvite} activeOpacity={0.85}>
            <Text style={styles.inviteBtnText}>Udostępnij</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryBtn, styles.inviteBtnFlex]} onPress={copyInviteLink} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Kopiuj link</Text>
          </TouchableOpacity>
        </View>

        {myInviteCode && (
          <TouchableOpacity style={[styles.secondaryBtn, styles.fullWidth]} onPress={copyInviteCode} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Kopiuj kod</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add by code */}
      <View style={styles.addCard}>
        <Text style={styles.addTitle}>Dodaj po kodzie</Text>
        <Text style={styles.addHint}>Wpisz kod od znajomego (bez spacji).</Text>
        <TextInput
          style={styles.addInput}
          value={codeInput}
          onChangeText={t => setCodeInput(t.toUpperCase())}
          placeholder="np. A3K9PQ2M"
          placeholderTextColor="rgba(232,230,224,0.3)"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={16}
        />
        <TouchableOpacity
          style={[styles.addCta, (!codeInput.trim() || sendingCode) && styles.addCtaDisabled]}
          onPress={() => void submitCode()}
          disabled={!codeInput.trim() || sendingCode}
          activeOpacity={0.85}
        >
          {sendingCode
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.addCtaText}>Wyślij zaproszenie</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Add by nick */}
      <View style={styles.addCard}>
        <Text style={styles.addTitle}>Dodaj po nicku</Text>
        <Text style={styles.addHint}>Min. 2 znaki.</Text>
        <View style={styles.nickSearchRow}>
          <TextInput
            style={[styles.addInput, styles.nickInput]}
            value={nickSearch}
            onChangeText={t => void searchNick(t)}
            placeholder="Szukaj nicku..."
            placeholderTextColor="rgba(232,230,224,0.3)"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchingNick && <ActivityIndicator color="#7F77DD" style={styles.nickSpinner} />}
        </View>
        {nickResults.map(u => (
          <TouchableOpacity
            key={u.id}
            style={styles.nickHit}
            onPress={() => {
              void handleInviteFromLink(u.id)
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.nickHitText}>{u.nick}</Text>
            <Text style={styles.nickHitAdd}>Zaproś</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Incoming invites */}
      {betInvites.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Zaproszenia do zakładów</Text>
          {betInvites.map(invite => (
            <View key={invite.id} style={styles.rowCard}>
              <View style={styles.rowLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTxt}>{invite.fromNick[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowNick}>{invite.fromNick}</Text>
                  <Text style={styles.rowMeta}>{invite.message}</Text>
                </View>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity style={styles.btnGhost} onPress={() => void rejectBetInvite(invite)}>
                  <Text style={styles.btnGhostText}>Odrzuć</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => void acceptBetInvite(invite)}>
                  <Text style={styles.btnPrimaryText}>Akceptuj</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Incoming invites */}
      {incoming.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Zaproszenia</Text>
          {incoming.map(r => (
            <View key={r.id} style={styles.rowCard}>
              <View style={styles.rowLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTxt}>{nick(r.user_a)[0]?.toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.rowNick}>{nick(r.user_a)}</Text>
                  <Text style={styles.rowMeta}>Chce być znajomym</Text>
                </View>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity style={styles.btnGhost} onPress={() => void reject(r)}>
                  <Text style={styles.btnGhostText}>Odrzuć</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => void accept(r)}>
                  <Text style={styles.btnPrimaryText}>Akceptuj</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Outgoing invites */}
      {outgoing.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Wysłane</Text>
          {outgoing.map(r => (
            <View key={r.id} style={styles.rowCard}>
              <View style={styles.rowLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTxt}>{nick(r.user_b)[0]?.toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.rowNick}>{nick(r.user_b)}</Text>
                  <Text style={styles.rowMeta}>Oczekuje na akceptację</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.btnGhost} onPress={() => void reject(r)}>
                <Text style={styles.btnGhostText}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Friends list */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Twoi znajomi ({friends.length})</Text>
        {friends.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Brak znajomych — użyj zaproszenia powyżej.</Text>
          </View>
        ) : (
          friends.map(r => {
            const oid = me ? otherId(r, me) : ''
            return (
              <View key={r.id} style={styles.friendRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTxt}>{nick(oid)[0]?.toUpperCase()}</Text>
                </View>
                <Text style={styles.friendNick}>{nick(oid)}</Text>
              </View>
            )
          })
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f1117' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#e8e6e0', marginBottom: 6 },
  subtitle: { fontSize: 13, color: 'rgba(232,230,224,0.5)', lineHeight: 19, marginBottom: 24 },
  inviteCard: { backgroundColor: '#181c24', borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330', padding: 18, marginBottom: 16 },
  inviteTitle: { fontSize: 16, fontWeight: '600', color: '#e8e6e0', marginBottom: 6 },
  inviteDesc: { fontSize: 13, color: 'rgba(232,230,224,0.45)', lineHeight: 19, marginBottom: 14 },
  codeBox: { backgroundColor: '#1e2330', borderRadius: 12, padding: 14, marginBottom: 14, alignItems: 'center' },
  codeLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(232,230,224,0.45)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  codeValue: { fontSize: 22, fontWeight: '800', color: '#7F77DD', letterSpacing: 3 },
  codeHint: { fontSize: 12, color: 'rgba(232,230,224,0.35)', lineHeight: 17, marginBottom: 14 },
  inviteActions: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  inviteBtn: { backgroundColor: '#534AB7', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  inviteBtnFlex: { flex: 1 },
  inviteBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#1e2330', backgroundColor: '#181c24' },
  fullWidth: { width: '100%' },
  secondaryBtnText: { color: '#7F77DD', fontSize: 14, fontWeight: '700' },
  addCard: { backgroundColor: '#181c24', borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330', padding: 18, marginBottom: 16 },
  addTitle: { fontSize: 15, fontWeight: '600', color: '#e8e6e0', marginBottom: 6 },
  addHint: { fontSize: 12, color: 'rgba(232,230,224,0.4)', marginBottom: 12, lineHeight: 17 },
  addInput: { backgroundColor: '#1e2330', borderWidth: 0.5, borderColor: '#1e2330', borderRadius: 12, padding: 14, fontSize: 16, color: '#e8e6e0', marginBottom: 12 },
  addCta: { backgroundColor: '#534AB7', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addCtaDisabled: { opacity: 0.35 },
  addCtaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  nickSearchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  nickInput: { flex: 1, marginBottom: 8 },
  nickSpinner: { marginLeft: 10 },
  nickHit: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e2330', borderRadius: 10, padding: 12, marginTop: 6 },
  nickHitText: { fontSize: 14, color: '#e8e6e0', fontWeight: '500' },
  nickHitAdd: { fontSize: 13, color: '#7F77DD', fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(232,230,224,0.45)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  rowCard: { backgroundColor: '#181c24', borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330', padding: 14, marginBottom: 10, gap: 12 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#534AB730', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 16, fontWeight: '700', color: '#7F77DD' },
  rowNick: { fontSize: 14, fontWeight: '600', color: '#e8e6e0' },
  rowMeta: { fontSize: 12, color: 'rgba(232,230,224,0.4)', marginTop: 2 },
  rowActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btnGhost: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 0.5, borderColor: '#1e2330' },
  btnGhostText: { fontSize: 13, fontWeight: '600', color: 'rgba(232,230,224,0.6)' },
  btnPrimary: { backgroundColor: '#1D9E75', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  btnPrimaryText: { fontSize: 13, fontWeight: '700', color: '#e8e6e0' },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#181c24', borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330', padding: 14, marginBottom: 8 },
  friendNick: { fontSize: 15, fontWeight: '600', color: '#e8e6e0' },
  empty: { backgroundColor: '#181c24', borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330', padding: 22, alignItems: 'center' },
  emptyText: { fontSize: 14, color: 'rgba(232,230,224,0.45)' },
})
