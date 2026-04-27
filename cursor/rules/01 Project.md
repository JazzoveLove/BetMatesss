# BetMates — Projekt

## Czym jest BetMates

BetMates to mobilna aplikacja dla paczki znajomych która robi dwie rzeczy:

1. **Tracker rywalizacji** — historia meczów, statystyki, kto jest lepszy w czym w grupie
2. **Tracker zakładów** — opcjonalne stawki finansowe, rozliczenia kto komu ile winien

Użytkownik może dodać mecz bez stawki (tylko statystyki) ALBO ze stawką (rozliczenie finansowe). Oba tryby są równoważne. Stawka jest opcją, nie wymogiem.

BetMates NIE jest bukmacherem. Brak integracji z bukmacherami. Brak obsługi płatności — tylko śledzenie długów między znajomymi.

---

## Stos technologiczny

| Technologia | Rola |
|---|---|
| React Native + Expo | Framework iOS + Android (TypeScript) |
| Supabase PostgreSQL | Baza danych |
| Supabase Auth | Logowanie przez email (MVP) |
| Supabase Realtime | Synchronizacja na żywo między graczami |
| React Navigation | Nawigacja (bottom tabs) |
| Zustand | Zarządzanie stanem |

---

## Język

Aplikacja w 100% po polsku. Wszystkie teksty, komunikaty, powiadomienia — po polsku.

---

## Dwa tryby tworzenia meczu

| Tryb | Opis | Kiedy |
|---|---|---|
| Bez stawki (default) | Tylko statystyki i historia. Zero rozliczeń. | Codzienne mecze |
| Ze stawką | Statystyki + stawka finansowa + rozliczenie | Gdy gra się o pieniądze |

---

## Zasady ogólne — zawsze przestrzegaj

1. Zawsze TypeScript (.tsx/.ts) — nigdy .js/.jsx
2. Kolory TYLKO z `constants/colors.ts` — nigdy hardcodowane hex
3. `supabase.from()` TYLKO w `services/` — nigdy w `app/` ani `components/`
4. Typy TYLKO w `types/` — nigdy inline w ekranach
5. `stake_mode='none'` jest domyślny przy tworzeniu zakładu
6. Nazwy plików: ekrany kebab-case, serwisy camelCase.service.ts, hooki useCamelCase.ts
7. Każdy hook zwraca `{ data, loading, error }`
8. BetMates NIE jest bukmacherem — zero danych sportowych z zewnątrz