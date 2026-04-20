# BetMates — Specyfikacja formatów rozgrywki

## Format 1 — Jeden mecz
Najprostszy format. Jeden wynik rozstrzyga zakład.
- Pole na wynik: X : Y (np. 5:3) lub Wygrana/Przegrana
- Po wpisaniu wyniku obie strony potwierdzają
- Rozliczenie natychmiastowe

## Format 2 — Zakład za mecz (na żywo)
Gracze grają dowolną liczbę meczów. Każdy mecz to osobna stawka.
- Stawka ustalona z góry (np. 10 zł za mecz)
- Po każdym meczu organizator wpisuje kto wygrał
- Drugi uczestnik potwierdza
- Apka na bieżąco pokazuje: liczba meczów, łączny bilans (np. Maciek +20 zł, Janek -20 zł)
- Zakład kończy się gdy organizator kliknie "Zakończ turniej"
- Końcowe podsumowanie: tabela wyników wszystkich meczów + łączne rozliczenie

Przykład: Clash Royale 10 zł/mecz
Mecz 1: Maciek wygrał → Maciek +10, Janek -10
Mecz 2: Janek wygrał → bilans wyrównany
Mecz 3: Maciek wygrał → Maciek +10, Janek -10
Mecz 4: Maciek wygrał → Maciek +20, Janek -20
Zakończenie: Janek winien Maćkowi 20 zł

## Format 3 — Best of X
Z góry ustalona liczba meczów (Best of 3, Best of 5, Best of 7).
- Organizator wybiera Best of 3 / 5 / 7
- Jedna łączna stawka (np. 20 zł)
- Wygrywa kto pierwszy osiągnie wymaganą liczbę wygranych (2 z 3, 3 z 5, 4 z 7)
- Zakład kończy się automatycznie gdy ktoś osiągnie wymaganą liczbę
- Nie trzeba grać wszystkich meczów (Best of 3 może skończyć się po 2 meczach)

Przykład: Best of 3, stawka 20 zł
Mecz 1: Maciek wygrał (Maciek 1-0)
Mecz 2: Janek wygrał (1-1)
Mecz 3: Maciek wygrał (Maciek 2-1) → KONIEC, Maciek wygrywa 20 zł

## Format 4 — Round Robin (każdy z każdym)
Każdy uczestnik gra z każdym. Ranking po wszystkich meczach.
- Apka automatycznie generuje wszystkie pary
- Organizator wpisuje wyniki par po kolei
- Tabela na żywo: punkty, wygrane, przegrane
- Zwycięzca: gracz z największą liczbą wygranych
- Przy remisie: opcja dogrywki lub podział puli

Przykład: 4 graczy → 6 par (każdy z każdym raz)
Pula: 4 × 30 zł = 120 zł → zwycięzca bierze całość

## Format 5 — Eliminacje (drabinka)
Klasyczna drabinka turniejowa. Przegrany odpada, zwycięzca przechodzi dalej.

Dwa tryby:
A) AUTO — apka automatycznie losuje pary w każdej rundzie
B) RĘCZNY — organizator sam decyduje kto z kim gra

Flow:
- Organizator tworzy turniej, dodaje uczestników
- Wybiera tryb (auto/ręczny)
- Runda 1: pary tworzone → wyniki wpisywane → zwycięzcy przechodzą
- Runda 2: nowe pary ze zwycięzców → itd.
- Finał: 2 ostatnich graczy → zwycięzca bierze pulę

Przykład: Piłkarzyki, 4 graczy, 30 zł każdy = 120 zł pula
Półfinał: Tomek vs Mateusz (wygrał Tomek), Maciek vs Adrian (wygrał Adrian)
Finał: Tomek vs Adrian (wygrał Tomek)
Rozliczenie: Tomek +90 zł, reszta -30 zł

## Format 6 — Sesja (wieczór wielu dyscyplin)
Jeden event grupujący wiele zakładów różnych dyscyplin.
- Organizator tworzy Sesję z nazwą (np. "Wielka Liga Wojszycka")
- Dodaje uczestników sesji raz (wszyscy grają we wszystkich dyscyplinach)
- Dodaje dyscypliny jedna po drugiej — każda ma własny format i stawkę
- Każda dyscyplina to osobny zakład (osobne rozliczenie)
- Widok sesji pokazuje wszystkie dyscypliny z statusami i wynikami
- Podsumowanie sesji: łączny bilans każdego uczestnika przez wszystkie dyscypliny

Przykład: Wielka Liga Wojszycka, 4 graczy
- Piłkarzyki: format Eliminacje, 30 zł/os → Tomek wygrywa 90 zł
- Mini hokej: format Eliminacje, 30 zł/os → Adrian wygrywa 90 zł  
- Dart: format Round Robin, 30 zł/os → Tomek wygrywa 90 zł
- Clash Royale: format Round Robin, 30 zł/os → dowolny zwycięzca

Łączny bilans po sesji:
Tomek: +90 (piłkarzyki) -30 (hokej) +90 (dart) -30 (CR) = +120 zł
Adrian: -30 (piłkarzyki) +90 (hokej) -30 (dart) -30 (CR) = 0 zł
itd.

## Tabela bets — dodatkowe pola potrzebne
```
bets:
  - format: 'single' | 'per_match' | 'best_of' | 'round_robin' | 'elimination' | 'session'
  - best_of_count: number (3/5/7, tylko dla best_of)
  - stake_per_match: number (tylko dla per_match)
  - session_id: uuid (tylko dla dyscyplin w sesji)
  - bracket_mode: 'auto' | 'manual' (tylko dla elimination)
  - status: 'pending' | 'active' | 'in_progress' | 'completed' | 'disputed'

sessions:
  - id, creator_id, title, date, participants jsonb, created_at

bet_results:
  - match_number: number
  - round_number: number (dla eliminacji i round robin)
  - winner_id: uuid
  - scores: jsonb (np. {"p1": 5, "p2": 3})
  - confirmed: boolean
```

## Widok aktywnego zakładu — co pokazywać per format

### per_match (zakład za mecz)
- Lista wszystkich rozegranych meczów z wynikami
- Bieżący bilans każdego gracza
- Przycisk "Wpisz wynik meczu"
- Przycisk "Zakończ turniej" (tylko organizator)

### best_of
- Aktualny stan: np. "Maciek 2 - 1 Janek"
- Pasek postępu do wymaganej liczby wygranych
- Historia meczów
- Przycisk "Wpisz wynik meczu"
- Auto-zakończenie gdy ktoś wygra wymaganą liczbę

### round_robin
- Tabela punktacji na żywo
- Lista par do rozegrania (niezagrane szare, zagrane z wynikiem)
- Przycisk "Wpisz wynik pary"

### elimination
- Wizualna drabinka (bracket)
- Aktualna runda
- Pary w tej rundzie
- Przycisk "Wpisz wynik pary" / "Losuj następną rundę" (auto) / "Ustaw parę" (ręczny)

### session
- Lista dyscyplin z ikonami, statusami i wynikami
- Łączna tabela punktacji sesji
- Przycisk "Dodaj dyscyplinę" (tylko organizator)
