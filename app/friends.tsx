import { ActivityIndicator, RefreshControl, Share, Alert } from 'react-native'
import { ScrollView, YStack, XStack, Text, Input, Button } from 'tamagui'
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
      <YStack flex={1} style={{ backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#7F77DD" size="large" />
      </YStack>
    )
  }

  const inputStyle = {
    backgroundColor: '#1e2330',
    borderWidth: 0.5,
    borderColor: '#1e2330',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#e8e6e0',
  } as const

  return (
    <ScrollView
      flex={1}
      style={{ backgroundColor: '#0f1117' }}
      contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 40 } as any}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7F77DD" colors={['#7F77DD']} />
      }
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#e8e6e0', marginBottom: 6 }}>Znajomi</Text>
      <Text style={{ fontSize: 13, color: 'rgba(232,230,224,0.5)', lineHeight: 19, marginBottom: 24 }}>
        Ranking — wkrótce. Zaproś linkiem, kodem albo znajdź osobę po nicku.
      </Text>

      <YStack
        style={{
          backgroundColor: '#181c24',
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: '#1e2330',
          padding: 18,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#e8e6e0', marginBottom: 6 }}>Zaproś znajomego</Text>
        <Text style={{ fontSize: 13, color: 'rgba(232,230,224,0.45)', lineHeight: 19, marginBottom: 14 }}>
          Link działa po kliknięciu w telefonie. Kod możesz wysłać SMS-em lub messengera.
        </Text>

        {myInviteCode ? (
          <YStack style={{ backgroundColor: '#1e2330', borderRadius: 12, padding: 14, marginBottom: 14, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(232,230,224,0.45)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
              Twój kod
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#7F77DD', letterSpacing: 3 }}>{myInviteCode}</Text>
          </YStack>
        ) : (
          <Text style={{ fontSize: 12, color: 'rgba(232,230,224,0.35)', lineHeight: 17, marginBottom: 14 }}>
            Po dodaniu kolumny w bazie (skrypt users_invite_code.sql) pojawi się tu kod.
          </Text>
        )}

        <XStack style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <Button
            onPress={shareInvite}
            style={{ flex: 1, backgroundColor: '#534AB7', borderRadius: 12, height: 48 }}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Udostępnij</Text>
          </Button>
          <Button
            chromeless
            onPress={copyInviteLink}
            style={{
              flex: 1,
              borderRadius: 12,
              height: 48,
              borderWidth: 0.5,
              borderColor: '#1e2330',
              backgroundColor: '#181c24',
            }}
          >
            <Text style={{ color: '#7F77DD', fontSize: 14, fontWeight: '700' }}>Kopiuj link</Text>
          </Button>
        </XStack>

        {myInviteCode && (
          <Button
            chromeless
            onPress={copyInviteCode}
            style={{
              width: '100%',
              borderRadius: 12,
              height: 48,
              borderWidth: 0.5,
              borderColor: '#1e2330',
              backgroundColor: '#181c24',
            }}
          >
            <Text style={{ color: '#7F77DD', fontSize: 14, fontWeight: '700' }}>Kopiuj kod</Text>
          </Button>
        )}
      </YStack>

      <YStack
        style={{
          backgroundColor: '#181c24',
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: '#1e2330',
          padding: 18,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#e8e6e0', marginBottom: 6 }}>Dodaj po kodzie</Text>
        <Text style={{ fontSize: 12, color: 'rgba(232,230,224,0.4)', marginBottom: 12, lineHeight: 17 }}>
          Wpisz kod od znajomego (bez spacji).
        </Text>
        <Input
          value={codeInput}
          onChangeText={t => setCodeInput(t.toUpperCase())}
          placeholder="np. A3K9PQ2M"
          placeholderTextColor={'rgba(232,230,224,0.3)' as never}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={16}
          style={{ ...inputStyle, marginBottom: 12 }}
        />
        <Button
          disabled={!codeInput.trim() || sendingCode}
          onPress={() => void submitCode()}
          style={{
            backgroundColor: '#534AB7',
            borderRadius: 12,
            height: 48,
            opacity: !codeInput.trim() || sendingCode ? 0.35 : 1,
          }}
        >
          {sendingCode ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Wyślij zaproszenie</Text>}
        </Button>
      </YStack>

      <YStack
        style={{
          backgroundColor: '#181c24',
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: '#1e2330',
          padding: 18,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#e8e6e0', marginBottom: 6 }}>Dodaj po nicku</Text>
        <Text style={{ fontSize: 12, color: 'rgba(232,230,224,0.4)', marginBottom: 12, lineHeight: 17 }}>
          Min. 2 znaki.
        </Text>
        <XStack style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Input
            value={nickSearch}
            onChangeText={t => void searchNick(t)}
            placeholder="Szukaj nicku..."
            placeholderTextColor={'rgba(232,230,224,0.3)' as never}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ ...inputStyle, flex: 1, marginBottom: 8 }}
          />
          {searchingNick && <ActivityIndicator color="#7F77DD" style={{ marginLeft: 10 }} />}
        </XStack>
        {nickResults.map(u => (
          <XStack
            key={u.id}
            onPress={() => {
              void handleInviteFromLink(u.id)
            }}
            pressStyle={{ opacity: 0.75 }}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#1e2330',
              borderRadius: 10,
              padding: 12,
              marginTop: 6,
            }}
          >
            <Text style={{ fontSize: 14, color: '#e8e6e0', fontWeight: '500' }}>{u.nick}</Text>
            <Text style={{ fontSize: 13, color: '#7F77DD', fontWeight: '700' }}>Zaproś</Text>
          </XStack>
        ))}
      </YStack>

      {betInvites.length > 0 && (
        <YStack style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(232,230,224,0.45)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
            Zaproszenia do zakładów
          </Text>
          {betInvites.map(invite => (
            <YStack
              key={invite.id}
              style={{
                backgroundColor: '#181c24',
                borderRadius: 14,
                borderWidth: 0.5,
                borderColor: '#1e2330',
                padding: 14,
                marginBottom: 10,
                gap: 12,
              }}
            >
              <XStack style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <YStack
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#534AB730',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#7F77DD' }}>
                    {invite.fromNick[0]?.toUpperCase()}
                  </Text>
                </YStack>
                <YStack flex={1}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#e8e6e0' }}>{invite.fromNick}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(232,230,224,0.4)', marginTop: 2 }}>{invite.message}</Text>
                </YStack>
              </XStack>
              <XStack style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <Button
                  chromeless
                  onPress={() => void rejectBetInvite(invite)}
                  style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 0.5, borderColor: '#1e2330' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(232,230,224,0.6)' }}>Odrzuć</Text>
                </Button>
                <Button
                  onPress={() => void acceptBetInvite(invite)}
                  style={{ backgroundColor: '#1D9E75', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#e8e6e0' }}>Akceptuj</Text>
                </Button>
              </XStack>
            </YStack>
          ))}
        </YStack>
      )}

      {incoming.length > 0 && (
        <YStack style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(232,230,224,0.45)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
            Zaproszenia
          </Text>
          {incoming.map(r => (
            <YStack
              key={r.id}
              style={{
                backgroundColor: '#181c24',
                borderRadius: 14,
                borderWidth: 0.5,
                borderColor: '#1e2330',
                padding: 14,
                marginBottom: 10,
                gap: 12,
              }}
            >
              <XStack style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <YStack
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#534AB730',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#7F77DD' }}>
                    {nick(r.user_a)[0]?.toUpperCase()}
                  </Text>
                </YStack>
                <YStack>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#e8e6e0' }}>{nick(r.user_a)}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(232,230,224,0.4)', marginTop: 2 }}>Chce być znajomym</Text>
                </YStack>
              </XStack>
              <XStack style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <Button
                  chromeless
                  onPress={() => void reject(r)}
                  style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 0.5, borderColor: '#1e2330' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(232,230,224,0.6)' }}>Odrzuć</Text>
                </Button>
                <Button
                  onPress={() => void accept(r)}
                  style={{ backgroundColor: '#1D9E75', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#e8e6e0' }}>Akceptuj</Text>
                </Button>
              </XStack>
            </YStack>
          ))}
        </YStack>
      )}

      {outgoing.length > 0 && (
        <YStack style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(232,230,224,0.45)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
            Wysłane
          </Text>
          {outgoing.map(r => (
            <XStack
              key={r.id}
              style={{
                backgroundColor: '#181c24',
                borderRadius: 14,
                borderWidth: 0.5,
                borderColor: '#1e2330',
                padding: 14,
                marginBottom: 10,
                gap: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <XStack style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <YStack
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#534AB730',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#7F77DD' }}>
                    {nick(r.user_b)[0]?.toUpperCase()}
                  </Text>
                </YStack>
                <YStack>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#e8e6e0' }}>{nick(r.user_b)}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(232,230,224,0.4)', marginTop: 2 }}>Oczekuje na akceptację</Text>
                </YStack>
              </XStack>
              <Button
                chromeless
                onPress={() => void reject(r)}
                style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 0.5, borderColor: '#1e2330' }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(232,230,224,0.6)' }}>Anuluj</Text>
              </Button>
            </XStack>
          ))}
        </YStack>
      )}

      <YStack style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(232,230,224,0.45)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
          Twoi znajomi ({friends.length})
        </Text>
        {friends.length === 0 ? (
          <YStack
            style={{
              backgroundColor: '#181c24',
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: '#1e2330',
              padding: 22,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, color: 'rgba(232,230,224,0.45)' }}>
              Brak znajomych — użyj zaproszenia powyżej.
            </Text>
          </YStack>
        ) : (
          friends.map(r => {
            const oid = me ? otherId(r, me) : ''
            return (
              <XStack
                key={r.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: '#181c24',
                  borderRadius: 14,
                  borderWidth: 0.5,
                  borderColor: '#1e2330',
                  padding: 14,
                  marginBottom: 8,
                }}
              >
                <YStack
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#534AB730',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#7F77DD' }}>
                    {nick(oid)[0]?.toUpperCase()}
                  </Text>
                </YStack>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#e8e6e0' }}>{nick(oid)}</Text>
              </XStack>
            )
          })
        )}
      </YStack>
    </ScrollView>
  )
}
