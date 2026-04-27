# BetMates — Kolory i UI

## Kolory (constants/colors.ts)

```typescript
export const Colors = {
  background: '#0f1117',              // tło ekranów
  card: '#181c24',                    // karty, listy
  cardAlt: '#1e2330',                 // inputy, modale, pressed state
  accent: '#534AB7',                  // przyciski, aktywne elementy, border selected
  accentLight: '#7F77DD',             // linki, ikony, tekst akcentowany
  text: '#e8e6e0',                    // tytuły, treść
  textMuted: 'rgba(232,230,224,0.5)', // opisy, daty, metadane
  green: '#1D9E75',                   // wygrana, bilans dodatni, sukces
  red: '#E24B4A',                     // przegrana, bilans ujemny, błąd
  amber: '#EF9F27',                   // oczekuje, stawka, uwaga
  border: 'rgba(255,255,255,0.08)',   // ramki kart
}
```

Nigdy nie hardcoduj kolorów hex w komponentach. Zawsze `Colors.xxx`.

---

## Typografia

```typescript
// Rozmiary
heading:    24px, fontWeight: '700'
subheading: 18px, fontWeight: '600'
body:       16px, fontWeight: '400'
small:      14px, fontWeight: '400'
caption:    12px, fontWeight: '400'
label:      11px, fontWeight: '500', letterSpacing: 1.5, uppercase

// Kolory
główny:       Colors.text
drugorzędny:  Colors.textMuted
akcentowany:  Colors.accentLight
```

---

## Komponenty — style bazowe

### Karta (card)
```typescript
{
  backgroundColor: Colors.card,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: Colors.border,
  padding: 16,
  marginBottom: 8,
}
```

### Karta selected/active
```typescript
{
  backgroundColor: 'rgba(83,74,183,0.1)',
  borderColor: Colors.accent,
}
```

### Row (wiersz listy)
```typescript
{
  height: 56,                    // 68 jeśli ma podtytuł
  backgroundColor: Colors.card,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: Colors.border,
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  marginBottom: 8,
}
```

### Row pressed
```typescript
{
  backgroundColor: Colors.cardAlt,
  borderColor: Colors.accent,
  transform: [{ scale: 0.98 }],
}
```

### Przycisk główny (CTA)
```typescript
{
  backgroundColor: Colors.accent,
  borderRadius: 12,
  height: 52,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 24,
}
// tekst: Colors.text, fontWeight: '600', fontSize: 16
```

### Przycisk nieaktywny
```typescript
{
  backgroundColor: Colors.cardAlt,
  // opacity: 0.5 lub inny styl wskazujący nieaktywność
}
// tekst: Colors.textMuted
```

### Input
```typescript
{
  backgroundColor: Colors.cardAlt,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: Colors.border,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: Colors.text,
  fontSize: 16,
}
// focused border: Colors.accent
```

### Badge statusu
```typescript
// pending:  backgroundColor amber + text amber
// active:   backgroundColor green + text green
// completed: backgroundColor green + text green
// disputed: backgroundColor red + text red

{
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
  // backgroundColor: rgba(kolor, 0.15)
  // color: kolor
}
```

### Nagłówek sekcji
```typescript
{
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: Colors.textMuted,
  marginTop: 24,
  marginBottom: 8,
  paddingHorizontal: 16,
}
```

---

## Layout zasady

### Bottom tab bar
Każdy ekran ze ScrollView musi mieć `paddingBottom: 40` w `contentContainerStyle` żeby ostatni element nie był przycięty przez tab bar.

### Klawiatura
Każdy ekran z inputami musi być opakowany w KeyboardAvoidingView:

```typescript
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
  <ScrollView
    contentContainerStyle={{ flexGrow: 1 }}
    keyboardShouldPersistTaps="handled"
  >
    // zawartość
  </ScrollView>
</KeyboardAvoidingView>
```

### Safe area
Używaj `useSafeAreaInsets()` dla bottom insets na iPhone z notchem.

### Minimalne rozmiary elementów dotykalnych
Minimum 44×44pt dla każdego przycisku (wytyczna Apple).

---

## Animacje

| Akcja | Animacja | Czas |
|---|---|---|
| Wejście na ekran | Fade in + slide up 20px | 250ms |
| Tapnięcie karty | Scale 0.98 | 100ms |
| Fokus inputa | Border kolor → accent | 150ms |
| Zaznaczenie opcji | Tło fade + checkmark | 200ms |
| Przejście między krokami | Slide left/right | 300ms |
| Toggle expand | Height animacja | 300ms |

---

## Nawigacja (bottom tab bar)

| Tab | Ekran | Ikona |
|---|---|---|
| Home | dashboard.tsx | dom |
| Historia | history.tsx | zegar/lista |
| + | new-bet.tsx | plus (wyróżniony, accent) |
| Znajomi | friends.tsx | ludzie |
| Profil | profile.tsx | osoba |

Przycisk + jest wyróżniony — większy, kolor accent, uniesiony.