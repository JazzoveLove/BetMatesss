# BetMates — Flow zakładu

## Statusy zakładu

| Status | Opis |
|---|---|
| `pending` | Czeka na akceptację uczestników |
| `active` | Wszyscy zaakceptowali, trwa |
| `awaiting_confirmation` | Wynik wpisany, czeka na potwierdzenie |
| `completed` | Zakończony, rozliczenie gotowe |
| `disputed` | Spór zgłoszony |

---

## Pełny flow — format single (jeden mecz)

```
1. Twórca tworzy zakład → status: pending
2. Uczestnicy dostają powiadomienie push
3. Uczestnik otwiera zakład → widzi grę, format, stawkę
4. Uczestnik klika "Akceptuję" lub "Odrzucam"
5. Wszyscy zaakceptowali → status: active
6. Twórca wpisuje wynik → modal EnterResult
7. status: awaiting_confirmation
8. Uczestnik widzi wynik → "Potwierdź" lub "Zgłoś spór"
9. Po potwierdzeniu → status: completed → tworzone są settlements
10. Sekcja ROZLICZENIE: kto komu ile winien + "Zapłacono"
```

---

## Flow — format per_match (zakład za mecz)

```
1. Tworzenie jak wyżej → status: pending → active
2. Twórca klika "+ Wpisz wynik meczu" po każdym meczu
3. EnterResult → zapisuje BetResult z match_number
4. Uczestnik potwierdza każdy mecz (lub auto-potwierdza)
5. Apka sumuje bilans na żywo po każdym meczu
6. Twórca klika "Zakończ sesję meczów"
7. Alert potwierdzający → status: completed
8. Settlements tworzone z sumy wszystkich meczów
```

Widok aktywnego per_match:
```
🏀 Koszykówka — Zakład za mecz
Kuba vs Marek · 20 zł/mecz

Mecz 1:  Kuba wygrał    21:18   Kuba +20 / Marek -20
Mecz 2:  Marek wygrał   21:19   bilans 0
Mecz 3:  Kuba wygrał    21:15   Kuba +20 / Marek -20

Bieżący bilans:
  Kuba  +20 zł ↑
  Marek -20 zł ↓

[ + Wpisz wynik meczu ]
[ Zakończ sesję ]  ← tylko twórca
```

---

## Flow — format best_of

```
1. Tworzenie → active
2. Po każdym meczu twórca wpisuje wynik (lub zwycięzcę lega dla darta)
3. Apka automatycznie sprawdza czy seria skończona
4. isBestOfComplete() → zwraca winner_id lub null
5. Gdy seria skończona → automatycznie status: completed
6. Settlements tworzone
```

```typescript
// utils/formats.ts
export const isBestOfComplete = (
  results: BetResult[],
  bestOfCount: number
): string | null => {
  const required = Math.ceil(bestOfCount / 2)
  const wins: Record<string, number> = {}
  for (const r of results) {
    wins[r.winner_id] = (wins[r.winner_id] ?? 0) + 1
    if (wins[r.winner_id] >= required) return r.winner_id
  }
  return null
}
```

---

## Flow — format round_robin

```
1. Tworzenie → active
2. Apka generuje wszystkie pary automatycznie
3. Twórca wpisuje wyniki par (dowolna kolejność)
4. Tabela punktacji aktualizuje się na żywo
5. Po wpisaniu wszystkich par → status: completed
6. Zwycięzca = gracz z najwyższą liczbą wygranych
7. Settlements tworzone
```

Liczba par: n × (n-1) / 2
- 3 graczy → 3 pary
- 4 graczy → 6 par

---

## Flow — format elimination (drabinka)

```
1. Tworzenie → active
2. Apka generuje pary rundy 1 (AUTO lub RĘCZNY)
3. Twórca wpisuje wyniki par rundy 1
4. Zwycięzcy przechodzą do rundy 2
5. Nowe pary → kolejne wyniki → aż do finału
6. Zwycięzca finału → status: completed
```

Obsługa niepełnych drabinek (np. 6 graczy):
Apka dodaje "bye" dla graczy bez pary w rundzie 1.

---

## Widok bet-detail.tsx — co pokazać per status

### status: pending

**Twórca widzi:**
- Informacja "Czeka na akceptację"
- Lista uczestników z checkmarkami kto zaakceptował
- Przycisk "Anuluj zakład"

**Uczestnik widzi:**
- Szczegóły zakładu (gra, format, stawka)
- Przycisk "Akceptuję" (zielony)
- Przycisk "Odrzucam" (czerwony)

---

### status: active

**Twórca i uczestnik widzą:**

Dla `single`:
- Przycisk "Wpisz wynik" → EnterResult modal

Dla `per_match`:
- Lista rozegranych meczów z wynikami i bilansem
- Bieżący bilans każdego gracza
- Przycisk "+ Wpisz wynik meczu"
- Przycisk "Zakończ sesję" (tylko twórca)

Dla `best_of`:
- Aktualny stan serii (np. "Kuba 2 — 1 Marek")
- Pasek postępu do wymaganej liczby wygranych
- Historia meczów/legów
- Przycisk "Wpisz wynik kolejnego meczu"
- Auto-zakończenie gdy ktoś dobije

Dla `round_robin`:
- Tabela punktacji na żywo
- Lista par (niezagrane szare, zagrane z wynikiem)
- Przycisk "Wpisz wynik pary"

Dla `elimination`:
- Wizualna drabinka
- Aktualna runda i pary
- Przycisk "Wpisz wynik pary"

---

### status: awaiting_confirmation

**Twórca widzi:**
"Czeka na potwierdzenie [nick]"

**Uczestnik widzi:**
```
[nick] wpisał wynik:
Kuba 5 — Marek 3

[ ✓ Potwierdź wynik ]
[ ✗ Zgłoś spór      ]
```

---

### status: completed

Obaj widzą sekcję ROZLICZENIE (tylko gdy stake_mode !== 'none'):

```
ROZLICZENIE

Marek jest winien Kubie    20 zł
[ Przypomnij ]

Piotrek jest winien Kubie  20 zł
[ ✓ Zapłacono ]
```

"Zapłacono" — tylko śledzenie, zero prawdziwych płatności.
"Przypomnij" — wysyła push notification do dłużnika.

---

### status: disputed

```
Spór zgłoszony.
Skontaktujcie się ze sobą i ustalcie wynik ręcznie.

[ Wpisz wynik ponownie ]  ← reset do active
```

---

## Komponenty wyniku (enter-result.tsx)

Ekran renderuje jeden z czterech komponentów na podstawie `game.resultType`:

### ScoreInput (resultType: 'score')
```
    Kuba       Marek
  [  5  ]  :  [  3  ]
       [ Zapisz ]
```
Klawiatura numeryczna auto. Zwycięzca wyznaczany automatycznie.
Przy remisie: opcja "Dogrywka" lub "Remis" zależnie od `supportsRematch`.

### LegsInput (resultType: 'legs') — Dart
```
Leg 1: [ Kuba ✓ ] [ Marek   ]
Leg 2: [ Kuba   ] [ Marek ✓ ]
Leg 3: [ Kuba ✓ ] [ Marek   ]
Stan: Kuba 2 — Marek 1
```
Auto-zakończenie gdy ktoś osiągnie ceil(bestOf/2).
Przycisk "Anuluj ostatni leg" dla pomyłek.

### WinnerPicker (resultType: 'winner_only')
```
[ Kuba wygrał  ]
[ Remis        ]  ← tylko jeśli supportsRematch: true
[ Marek wygrał ]
```
Duże przyciski, łatwe do tapnięcia.

### ChipCountInput (resultType: 'chips') — Poker chip_count
```
Kuba      [ 4500 ] żetonów  → +15 zł netto
Marek     [ 6000 ] żetonów  → +30 zł netto
Piotrek   [    0 ] żetonów  → -30 zł netto

Suma: 10500 / 18000 ← walidacja na żywo
```
Blokuje zapisanie jeśli suma żetonów się nie zgadza z pulą.

---

## Obliczanie rozliczeń (utils/settlements.ts)

```typescript
// Dla equal stakes — zwycięzca bierze pulę
export const calculateEqualSettlements = (
  participants: BetParticipant[],
  winnerId: string
): Settlement[] => {
  const total = participants.reduce((s, p) => s + p.stake_amount, 0)
  return participants
    .filter(p => p.user_id !== winnerId)
    .map(p => ({
      debtor_id: p.user_id,
      creditor_id: winnerId,
      amount: p.stake_amount,
    }))
}

// Dla per_match — suma wszystkich meczów
export const calculatePerMatchBalance = (
  results: BetResult[],
  stakePerMatch: number,
  participants: BetParticipant[]
): Record<string, number> => {
  const balance: Record<string, number> = {}
  participants.forEach(p => { balance[p.user_id] = 0 })

  for (const result of results) {
    const losers = participants.filter(p => p.user_id !== result.winner_id)
    balance[result.winner_id] += stakePerMatch * losers.length
    losers.forEach(p => { balance[p.user_id] -= stakePerMatch })
  }
  return balance
}

// Dla custom odds — kurs × stawka
export const calculateCustomSettlements = (
  participants: BetParticipant[],
  winnerId: string
): Settlement[] => {
  const winner = participants.find(p => p.user_id === winnerId)!
  return participants
    .filter(p => p.user_id !== winnerId)
    .map(p => ({
      debtor_id: p.user_id,
      creditor_id: winnerId,
      amount: p.stake_amount,
    }))
}
```

---

## Realtime — synchronizacja na żywo

Realtime subskrypcja w `hooks/useBetDetail.ts`:

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`bet-${betId}`)
    .on(                                    // .on() PRZED .subscribe()
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bets', filter: `id=eq.${betId}` },
      () => refreshBet()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bet_results', filter: `bet_id=eq.${betId}` },
      () => refreshResults()
    )
    .subscribe()                            // .subscribe() NA KOŃCU

  return () => supabase.removeChannel(channel)  // cleanup
}, [betId])
```