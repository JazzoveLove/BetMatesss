-- Add payment handshake fields for settlements.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_status_enum') then
    create type public.payment_status_enum as enum ('unpaid', 'pending_confirmation', 'paid', 'disputed');
  end if;
end $$;

alter table public.settlements
  add column if not exists payment_status public.payment_status_enum not null default 'unpaid',
  add column if not exists confirmed_by uuid null references public.users(id) on delete set null,
  add column if not exists confirmed_at timestamptz null;

-- Keep old boolean paid in sync for backward compatibility.
update public.settlements
set payment_status = case when paid = true then 'paid'::public.payment_status_enum else 'unpaid'::public.payment_status_enum end
where payment_status is null;

-- RLS: debtor can only request confirmation (unpaid -> pending_confirmation).
drop policy if exists "settlements_update_debtor" on public.settlements;
create policy "settlements_update_debtor_mark_pending"
  on public.settlements for update
  to authenticated
  using (auth.uid() = debtor_id)
  with check (
    auth.uid() = debtor_id
    and payment_status = 'pending_confirmation'
    and confirmed_by is null
  );

-- RLS: creditor can confirm or dispute only from pending_confirmation.
create policy "settlements_update_creditor_confirm_or_dispute"
  on public.settlements for update
  to authenticated
  using (auth.uid() = creditor_id)
  with check (
    auth.uid() = creditor_id
    and payment_status in ('paid', 'disputed')
  );
