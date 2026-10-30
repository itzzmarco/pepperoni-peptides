-- Peptide Ledger accounts: one row per regimen, dose, or check-in, owned by the signed-in user.
-- The app keeps a copy on each device and syncs changes here. Deleted items stay as markers
-- (deleted = true, data emptied) so a person's other devices learn to remove them too.

create table public.ledger_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('regimen', 'dose', 'checkin')),
  id text not null check (char_length(id) between 1 and 100),
  data jsonb not null default '{}'::jsonb check (octet_length(data::text) <= 20000),
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);

comment on table public.ledger_items is 'Peptide Ledger personal logs. Each row is visible only to its owner (row-level security).';

-- Devices ask for everything saved since they last looked.
create index ledger_items_user_updated on public.ledger_items (user_id, updated_at);

-- The server clock decides the order of saves, so a device with a wrong clock can't hide changes.
create function public.ledger_items_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger ledger_items_touch
before insert or update on public.ledger_items
for each row execute function public.ledger_items_touch();

-- Only signed-in people, and only their own rows. Signed-out visitors get nothing.
alter table public.ledger_items enable row level security;

revoke all on public.ledger_items from anon, authenticated;
grant select, insert, update, delete on public.ledger_items to authenticated;

create policy "Read own log" on public.ledger_items
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Add to own log" on public.ledger_items
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Change own log" on public.ledger_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Remove from own log" on public.ledger_items
  for delete to authenticated
  using ((select auth.uid()) = user_id);
