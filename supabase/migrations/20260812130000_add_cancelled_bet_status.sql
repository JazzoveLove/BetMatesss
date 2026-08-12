-- Dodaje status 'cancelled' dla zakładów anulowanych po sporze — odróżnia to
-- od 'rejected' (odrzucone zaproszenie, zakład nigdy nie ruszył). Zakłady
-- cancelled, w przeciwieństwie do rejected, mają zostać w historii na stałe
-- (getHistoryForUser filtruje po 24h tylko status = 'rejected').

alter table public.bets drop constraint bets_status_check;

alter table public.bets add constraint bets_status_check
  check (status = any (array['pending','active','awaiting_confirmation','completed','disputed','rejected','cancelled']));