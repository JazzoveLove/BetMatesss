-- Uruchom w Supabase → SQL Editor (jednorazowo).
-- Wymaga istniejącej tabeli public.users (id = auth.users.id).

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.users (id) on delete cascade,
  user_b uuid not null references public.users (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  constraint friendships_distinct_users check (user_a <> user_b),
  constraint friendships_pair_unique unique (user_a, user_b)
);

create index if not exists friendships_user_a_idx on public.friendships (user_a);
create index if not exists friendships_user_b_idx on public.friendships (user_b);

alter table public.friendships enable row level security;

create policy "friendships_select_own"
  on public.friendships for select
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Zaproszenie tworzy tylko osoba zapisana jako user_a (nadawca prośby).
create policy "friendships_insert_as_requester"
  on public.friendships for insert
  with check (auth.uid() = user_a);

create policy "friendships_update_own"
  on public.friendships for update
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "friendships_delete_own"
  on public.friendships for delete
  using (auth.uid() = user_a or auth.uid() = user_b);
