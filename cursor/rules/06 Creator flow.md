# BetMates — Kreator meczu (new-bet.tsx)

## Kolejność kroków

**Dyscyplina → Uczestnicy → Format → Stawka**

Format jest wybierany PO uczestnikach bo zależy od liczby osób.

> Plik reguł: `cursor/rules/06 Creator flow.md`

---

## Dwa punkty wejścia

### Wejście A — przez znajomego z dashboardu
```
Karta znajomego → "Nowy mecz"
→ Krok 1: Dyscyplina (znajomy widoczny u góry)
→ Krok 2: Uczestnicy (znajomy już zaznaczony)
→ Krok 3: Format
→ Krok 4: Stawka
```

### Wejście B — przez przycisk +
```
Przycisk + (bottom bar)
→ Krok 1: Dyscyplina
→ Krok 2: Uczestnicy (puste, musisz wybrać)
→ Krok 3: Format
→ Krok 4: Stawka
```

---

## Krok 1 — Dyscyplina

Header:
```
← Nowy mecz    1/4
━━░░░░░░░░░░░░░░░░
```

Jeśli wejście przez znajomego — baner pod headerem z awatarem znajomego.

Search bar — klawiatura NIE otwiera się automatycznie.

Stany search:
- pusty + unfocused → sekcje (Ostatnio, Sport, Video, Planszowe, Inne)
- focused + pusty → flat lista wszystkich gier
- focused + tekst → wyniki filtrowania z podświetleniem liter
- brak wyników → "Dodaj [query] jako własną grę"

Sekcje listy:
1. OSTATNIO UŻYWANE (max 3, tylko jeśli jest historia)
2. SPORT
3. GRY VIDEO
4. PLANSZOWE
5. INNE

Row dyscypliny — height 56px, tapnięcie = natychmiastowe przejście do kroku 2 (bez "Dalej").

Row w "Ostatnio" ma podtytuł: "z [nick] · [kiedy]" — height 68px.

---

## Krok 2 — Uczestnicy

Header:
```
← Wybierz uczestników    2/4
━━━━━━━━░░░░░░░░░░░░░░░
```

Pod headerem: emoji + nazwa dyscypliny.

Wybrani uczestnicy — awatary w rzędzie poziomym z ✕ do usunięcia.
Przycisk + na końcu rzędu żeby dodać kolejnego.

Lista znajomych do wyboru — tapnięcie zaznacza/odznacza.

Sticky footer:
- 0 osób → przycisk nieaktywny "Wybierz uczestników"
- 1 osoba → "Dalej z [nick] →"
- 2+ osób → "Dalej ([N] graczy) →"

---

## Krok 3 — Format

Header:
```
← Wybierz format    3/4
━━━━━━━━━━━━━━░░░░░░
```

Pod headerem: dyscyplina + skład (np. "⚽ Piłkarzyki · Kuba vs Marek").

### Logika filtrowania (utils/formats.ts)

```typescript
export const getAvailableFormats = (
  game: GameTemplate,
  participantCount: number  // liczba zaproszonych BEZ siebie
): BetFormat[] => {
  const total = participantCount + 1  // +1 = twórca

  return game.availableFormats.filter(format => {
    switch (format) {
      case 'single':      return total >= 2
      case 'best_of':     return total === 2
      case 'per_match':   return total === 2
      case 'round_robin': return total >= 3
      case 'elimination': return total >= 4
      case 'session':     return total >= 2
      default:            return false
    }
  })
}

export const getDefaultFormat = (
  game: GameTemplate,
  participantCount: number
): BetFormat => {
  const total = participantCount + 1
  if (game.id === 'poker') return 'single'
  if (total >= 4 && game.availableFormats.includes('elimination')) return 'elimination'
  if (total === 3 && game.availableFormats.includes('round_robin')) return 'round_robin'
  return game.defaultFormat
}
```

### Domyślne formaty per skład

| Skład | Default |
|---|---|
| 2 osoby | `game.defaultFormat` z GAME_TEMPLATES |
| 3 osoby | Round Robin (jeśli dostępny) lub Jeden mecz |
| 4+ osób | Eliminacje (jeśli dostępny) lub Round Robin |

### Karty formatów

Każdy format to karta z radio buttonem. Zaznaczona karta ma:
- tło: rgba(83,74,183,0.1)
- border: Colors.accent

Dla Best of X — picker [3] [5] [7] pojawia się inline w karcie gdy zaznaczona.

Default jest ustawiony automatycznie przy wejściu na krok 3.

### Formaty per skład (co pokazać)

**2 osoby + Piłkarzyki:**
Jeden mecz (def), Best of X, Zakład za mecz, Sesja

**2 osoby + Dart:**
Best of X (def), Jeden mecz, Zakład za mecz

**2 osoby + Clash Royale:**
Zakład za mecz (def), Jeden mecz, Best of X, Sesja

**2 osoby + Szachy:**
Jeden mecz (def), Best of X, Sesja

**3 osoby + Piłkarzyki:**
Round Robin (def), Jeden mecz, Sesja

**4+ osób + Piłkarzyki:**
Eliminacje (def), Round Robin, Drużynowy 2v2, Sesja

**Poker (zawsze):**
Zwycięzca bierze wszystko (def), Rozliczenie żetonami

---

## Krok 4 — Stawka

Header:
```
← Stawka    4/4
━━━━━━━━━━━━━━━━━━━━░░░
```

Pod headerem: podsumowanie (dyscyplina + skład + format).

### Toggle bez stawki / ze stawką

Domyślnie: **Bez stawki** zaznaczone.

Po przełączeniu na "Ze stawką":
- Pole kwoty: [20] zł
- Tryb: [Równe] [Własny kurs]

### Równe stawki

Podgląd puli na żywo:
"Pula: 40 zł (2 × 20 zł)"
"Wygrany dostaje: +20 zł netto"

### Własny kurs

Każdy uczestnik wpisuje swoją kwotę.
Kursy obliczane automatycznie na żywo z `utils/odds.ts`.

```typescript
// utils/odds.ts
export const calculateOdds = (
  stakes: Record<string, number>
): Record<string, number> => {
  const total = Object.values(stakes).reduce((s, v) => s + v, 0)
  return Object.fromEntries(
    Object.entries(stakes).map(([id, stake]) => [id, total / stake])
  )
}
// calculateOdds({ kuba: 20, marek: 10 }) → { kuba: 1.5, marek: 3.0 }
```

### Zakład za mecz (format per_match)

Zamiast "Kwota łączna" pokaż "Stawka za mecz":
- Pole: "Stawka za mecz: [20] zł"
- Podgląd: "Każdy mecz wart 20 zł · Grasz ile chcesz"

### Przycisk "Wyślij zakład"

Aktywny od razu (nawet bez stawki).
Po tapnięciu → `createBet()` z hooks/useBets → nawigacja na Home.

NIE wywołuj supabase bezpośrednio — użyj hooka.