# BetMates — Czysty i skalowalny kod

## 1. Zasada pojedynczej odpowiedzialności

Każdy plik, funkcja i komponent robi dokładnie jedną rzecz.

```typescript
// ❌ ŹLE — komponent robi za dużo
const BetCard = ({ bet }) => {
  const [loading, setLoading] = useState(false)
  const result = await supabase.from('bets').select()  // logika bazy
  const odds = bet.stake / total                        // obliczenia
  return <View>...</View>                               // UI
}

// ✅ DOBRZE — każda warstwa robi swoje
const BetCard = ({ bet, onPress }) => {          // tylko UI
  return <Pressable onPress={onPress}>...</Pressable>
}

// obliczenia w utils/
export const calculateOdds = (stake, total) => stake / total

// dane przez hook
const { bets, loading } = useBets()
```

---

## 2. Funkcje — krótkie i opisowe

Maksymalnie 20-30 linii na funkcję. Jeśli funkcja jest dłuższa — podziel ją.

```typescript
// ❌ ŹLE — za długa, za dużo odpowiedzialności
const handleSubmit = async () => {
  setLoading(true)
  const total = participants.reduce((s, p) => s + p.stake, 0)
  const odds = Object.fromEntries(
    participants.map(p => [p.id, total / p.stake])
  )
  const rivalry = await checkOrCreateRivalry(game.id, participants.map(p => p.id))
  const bet = await supabase.from('bets').insert({...})
  await supabase.from('bet_participants').insert(participants.map(p => ({...})))
  await sendPushNotifications(participants)
  setLoading(false)
  navigation.navigate('Home')
}

// ✅ DOBRZE — podzielone na małe funkcje
const handleSubmit = async () => {
  await createBet({           // cała logika w serwisie/hooku
    game, format, participants, stakeMode, stakeAmount
  })
  navigation.navigate('Home')
}
```

---

## 3. Nazewnictwo — opisowe i jednoznaczne

Nazwa zmiennej/funkcji powinna mówić co robi bez czytania jej środka.

```typescript
// ❌ ŹLE — niejasne nazwy
const d = new Date()
const x = participants.filter(p => p.c)
const handle = () => { ... }
const data = await fetch()

// ✅ DOBRZE — jasne nazwy
const createdAt = new Date()
const confirmedParticipants = participants.filter(p => p.confirmed)
const handleBetSubmit = () => { ... }
const userProfile = await fetchUserProfile(userId)
```

**Konwencje nazewnictwa:**

```typescript
// Booleany — zaczynają się od is/has/can/should
const isLoading = true
const hasConfirmed = false
const canSubmit = participants.length > 0
const shouldShowRivalry = results.length > 0

// Funkcje — zaczynają się od czasownika
const createBet = () => {}
const fetchResults = () => {}
const calculateOdds = () => {}
const handlePress = () => {}
const formatDate = () => {}

// Handlery eventów — zaczynają się od handle
const handleGameSelect = (game: GameTemplate) => {}
const handleParticipantToggle = (user: UserProfile) => {}
const handleSubmit = () => {}

// Stałe — UPPER_SNAKE_CASE
const MAX_PARTICIPANTS = 16
const DEFAULT_STAKE = 0
const BEST_OF_OPTIONS = [3, 5, 7]
```

---

## 4. Komponenty — małe i reużywalne

Komponent powinien mieścić się na ekranie (max ~100 linii).
Jeśli jest dłuższy — podziel na mniejsze komponenty.

```typescript
// ❌ ŹLE — jeden wielki komponent
const BetDetailScreen = () => {
  // 300 linii JSX z logiką, stylami i UI wymieszanymi
}

// ✅ DOBRZE — podzielone
const BetDetailScreen = () => {
  return (
    <ScrollView>
      <BetHeader bet={bet} />
      <ParticipantsList participants={participants} />
      <MatchHistory results={results} />
      <SettlementsSection settlements={settlements} />
      <ActionButtons bet={bet} onResult={handleResult} />
    </ScrollView>
  )
}
```

---

## 5. Props — typowane i z domyślnymi wartościami

```typescript
// ❌ ŹLE — brak typów, brak defaultów
const Avatar = ({ user, size, style }) => { ... }

// ✅ DOBRZE — pełne typowanie
interface AvatarProps {
  user: UserProfile
  size?: number           // opcjonalne
  style?: ViewStyle       // opcjonalne
}

const Avatar = ({ user, size = 40, style }: AvatarProps) => { ... }
```

---

## 6. Stałe zamiast magicznych liczb i stringów

```typescript
// ❌ ŹLE — magiczne wartości
if (participants.length > 16) { ... }
setStep(prev => prev + 1)
setTimeout(refresh, 3000)
<View style={{ height: 56 }} />

// ✅ DOBRZE — nazwane stałe
const MAX_PARTICIPANTS = 16
const REFRESH_INTERVAL_MS = 3000
const ROW_HEIGHT = 56

if (participants.length > MAX_PARTICIPANTS) { ... }
setTimeout(refresh, REFRESH_INTERVAL_MS)
<View style={{ height: ROW_HEIGHT }} />
```

---

## 7. Obsługa błędów — zawsze

```typescript
// ❌ ŹLE — brak obsługi błędów
const fetchBets = async () => {
  const { data } = await supabase.from('bets').select()
  setBets(data)
}

// ✅ DOBRZE — try/catch + komunikat dla użytkownika
const fetchBets = async () => {
  try {
    setLoading(true)
    const { data, error } = await supabase.from('bets').select()
    if (error) throw error
    setBets(data ?? [])
  } catch (err) {
    setError('Nie udało się pobrać zakładów')
    console.error('fetchBets:', err)
  } finally {
    setLoading(false)
  }
}
```

Każdy hook zwraca `{ data, loading, error }` — ekran decyduje co pokazać.

---

## 8. useEffect — czysty i z zależnościami

```typescript
// ❌ ŹLE — brak cleanup, brak zależności
useEffect(() => {
  const channel = supabase.channel('bets').subscribe()
  fetchBets()
})

// ✅ DOBRZE — cleanup + poprawne zależności
useEffect(() => {
  fetchBets()

  const channel = supabase
    .channel(`bet-${betId}`)
    .on('postgres_changes', { ... }, fetchBets)
    .subscribe()                      // subscribe() NA KOŃCU

  return () => supabase.removeChannel(channel)   // cleanup
}, [betId])                                       // zależności
```

---

## 9. Unikaj duplikacji (DRY — Don't Repeat Yourself)

```typescript
// ❌ ŹLE — ten sam styl w 5 miejscach
<View style={{ backgroundColor: '#181c24', borderRadius: 12, padding: 16 }}>
<View style={{ backgroundColor: '#181c24', borderRadius: 12, padding: 16 }}>
<View style={{ backgroundColor: '#181c24', borderRadius: 12, padding: 16 }}>

// ✅ DOBRZE — jeden styl w jednym miejscu
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  }
})
<View style={styles.card}>
<View style={styles.card}>
<View style={styles.card}>
```

```typescript
// ❌ ŹLE — ta sama logika w 3 ekranach
// dashboard.tsx
const winRate = wonBets / totalBets * 100
// history.tsx
const winRate = wonBets / totalBets * 100
// profile.tsx
const winRate = wonBets / totalBets * 100

// ✅ DOBRZE — jedna funkcja w utils/
// utils/stats.ts
export const calculateWinRate = (won: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((won / total) * 100)
}
```

---

## 10. Komponenty warunkowe — czytelnie

```typescript
// ❌ ŹLE — zagnieżdżone ternarye, trudne do czytania
return (
  <View>
    {isLoading ? <Spinner /> : error ? <ErrorView error={error} /> : data ? <DataView data={data} /> : <EmptyView />}
  </View>
)

// ✅ DOBRZE — early returns lub osobne komponenty
if (isLoading) return <LoadingScreen />
if (error) return <ErrorView error={error} />
if (!data || data.length === 0) return <EmptyView />

return <DataView data={data} />
```

---

## 11. StyleSheet — zawsze na dole pliku

```typescript
// ✅ DOBRZE — style na dole, poza komponentem
const MyComponent = () => {
  return <View style={styles.container} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
})
```

Nigdy nie twórz obiektów stylu inline w JSX (poza dynamicznymi wartościami):
```typescript
// ❌ ŹLE — nowy obiekt przy każdym renderze
<View style={{ flex: 1, backgroundColor: Colors.background }}>

// ✅ DOBRZE — StyleSheet
<View style={styles.container}>

// ✅ OK — dynamiczne wartości (nie da się inaczej)
<View style={[styles.card, { opacity: isDisabled ? 0.5 : 1 }]}>
```

---

## 12. Komentarze — tylko gdy kod nie mówi sam za siebie

```typescript
// ❌ ŹLE — komentarz który powtarza kod
// Dodaje 1 do licznika
setCount(prev => prev + 1)

// ✅ DOBRZE — komentarz wyjaśnia DLACZEGO, nie CO
// subscribe() musi być wywołane po wszystkich .on()
// inaczej Supabase rzuca błąd "cannot add callbacks after subscribe"
const channel = supabase
  .channel(...)
  .on(...)
  .subscribe()

// ✅ DOBRZE — komentarz z przykładem użycia (w utils/)
// calculateOdds({ kuba: 20, marek: 10 }) → { kuba: 1.5, marek: 3.0 }
export const calculateOdds = (stakes: Record<string, number>) => { ... }
```

---

## 13. Skalowalność — jak dodać nową dyscyplinę

Nowa dyscyplina = **tylko jeden plik do zmiany** — odpowiedni podplik kategorii:

```
constants/games/sport.ts   ← dla sportu fizycznego
constants/games/video.ts   ← dla gier video
constants/games/board.ts   ← dla gier planszowych
constants/games/custom.ts  ← dla własnych gier
```

Dodaj obiekt do odpowiedniego pliku:

```typescript
// np. constants/games/sport.ts
{
  id: 'nowa_gra',
  name: 'Nowa gra',
  emoji: '🎮',
  category: 'sport',
  resultType: 'score',
  defaultFormat: 'single',
  availableFormats: ['single', 'best_of', 'session'],
  scoringLabel: 'Punkty',
  winCondition: 'higher_score',
  supportsTeams: false,
  supportsRematch: false,
}
```

`constants/games.ts` agreguje podpliki — zwykle nie musisz go edytować.

Reszta działa automatycznie:
- Pojawia się na liście w kreatorze
- Właściwy komponent wyniku renderuje się sam
- Formaty filtrują się poprawnie
- Statystyki zliczają się per dyscyplina

**NIE dodawaj** `if (game.id === 'nowa_gra')` nigdzie w ekranach.

---

## 14. Skalowalność — jak dodać nowy format

Nowy format = zmiany w kilku miejscach:

1. `types/bet.types.ts` — dodaj do `BetFormat`
2. `constants/formats.ts` — dodaj obiekt do `BET_FORMATS`
3. `utils/formats.ts` — dodaj case w `getAvailableFormats()`
4. `app/bet-detail.tsx` — dodaj widok dla nowego formatu
5. Odpowiedni plik w `constants/games/` — dodaj format do `availableFormats` u wybranych gier


## 15. Rozszerzalność — zasada otwarta/zamknięta

Nowa funkcja = nowy kod. NIE modyfikuj istniejącego kodu jeśli nie musisz.

Wzorzec mapy komponentów zamiast switch:
const FORMAT_VIEWS: Record<BetFormat, ComponentType> = {
  single: SingleMatchView,
  // dodajesz nowy format → jedna linia
}

Widoki per format w osobnych plikach:
components/bet-formats/SingleMatchView.tsx
components/bet-formats/PerMatchView.tsx
components/bet-formats/SessionView.tsx  ← dodajesz gdy potrzebujesz

Serwisy per domena:
services/bets.service.ts     ← nie ruszasz gdy dodajesz sesję
services/sessions.service.ts ← nowy plik dla nowej funkcji

Każda funkcja w utils/formats.ts zaczyna od:
if (bet.format !== 'moj_format') return null
---

## Checklist przed każdym commitem

- [ ] Brak `supabase.from()` w `app/` lub `components/`
- [ ] Brak hardcodowanych kolorów hex — tylko `Colors.xxx`
- [ ] Każdy hook zwraca `{ data, loading, error }`
- [ ] Każdy `useEffect` z Realtime ma cleanup `removeChannel`
- [ ] Brak typów inline w ekranach — tylko `types/`
- [ ] Brak magicznych liczb — tylko nazwane stałe
- [ ] Obsługa błędów w każdym `async/await`
- [ ] StyleSheet na dole pliku, poza komponentem
- [ ] Funkcje max ~30 linii
- [ ] Komponenty max ~100 linii