-- Peptide Ledger partners: two accounts that can each see the other's log, read-only.
-- One person makes an invite code, the other enters it, and both get a row in `partners`.
-- Either one can unlink, which removes both rows. Nobody can change a partner's log:
-- the insert, update and delete policies on ledger_items still allow only the owner.

create table public.partners (
  user_id uuid not null references auth.users (id) on delete cascade,
  partner_id uuid not null references auth.users (id) on delete cascade,
  partner_name text not null default '' check (char_length(partner_name) <= 200),
  created_at timestamptz not null default now(),
  primary key (user_id, partner_id),
  check (user_id <> partner_id)
);

comment on table public.partners is 'Peptide Ledger partner links. A row lets user_id read partner_id''s log. Rows are made in pairs by accept_partner_invite and removed in pairs by unlink_partner.';

create index partners_partner on public.partners (partner_id);

alter table public.partners enable row level security;
revoke all on public.partners from anon, authenticated;
grant select on public.partners to authenticated;

create policy "See own partner links" on public.partners
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Codes waiting to be entered. Only the functions below read or write them.
create table public.partner_invites (
  code text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 days'
);

alter table public.partner_invites enable row level security;
revoke all on public.partner_invites from anon, authenticated;

-- A linked partner can read your log (and you theirs). Reading your own log is the existing policy.
create policy "Read partner's log" on public.ledger_items
  for select to authenticated
  using (exists (
    select 1 from public.partners p
    where p.user_id = (select auth.uid()) and p.partner_id = ledger_items.user_id
  ));

-- What to call an account: its Google name, else its email.
create function public.account_name(uid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', ''),
    u.email,
    ''
  )
  from auth.users u
  where u.id = uid;
$$;

-- Makes a new 6-character code for the signed-in person, replacing any code they made before.
-- Letters and digits that look alike (0/O, 1/I) are left out so it's easy to read aloud.
create function public.create_partner_invite()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea;
  c text;
begin
  if me is null then
    raise exception 'Sign in first.' using errcode = '28000';
  end if;
  delete from public.partner_invites where user_id = me or expires_at < now();
  loop
    -- The first six bytes of a random UUID are fully random; 32 letters divide 256 evenly.
    b := uuid_send(gen_random_uuid());
    c := '';
    for i in 0..5 loop
      c := c || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
    end loop;
    begin
      insert into public.partner_invites (code, user_id) values (c, me);
      return c;
    exception when unique_violation then
      -- Taken by someone else's open code; draw again.
    end;
  end loop;
end;
$$;

-- Links the signed-in person with whoever made the code, both ways. Returns that person's name.
create function public.accept_partner_invite(invite_code text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  them uuid;
begin
  if me is null then
    raise exception 'Sign in first.' using errcode = '28000';
  end if;
  select i.user_id into them
  from public.partner_invites i
  where i.code = upper(regexp_replace(coalesce(invite_code, ''), '[^A-Za-z0-9]', '', 'g'))
    and i.expires_at > now();
  if them is null then
    raise exception 'That code didn''t work. Check it, or ask your partner for a new one (codes last 2 days).' using errcode = 'P0002';
  end if;
  if them = me then
    raise exception 'That''s your own code. Your partner enters it on their account.' using errcode = '22023';
  end if;
  insert into public.partners (user_id, partner_id, partner_name)
  values (me, them, public.account_name(them)), (them, me, public.account_name(me))
  on conflict (user_id, partner_id) do update set partner_name = excluded.partner_name;
  delete from public.partner_invites where user_id = them;
  return public.account_name(them);
end;
$$;

-- Ends a link for both people.
create function public.unlink_partner(partner uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from public.partners
  where (user_id = (select auth.uid()) and partner_id = partner)
     or (user_id = partner and partner_id = (select auth.uid()));
$$;

revoke all on function public.account_name(uuid) from public, anon, authenticated;
revoke all on function public.create_partner_invite() from public, anon;
revoke all on function public.accept_partner_invite(text) from public, anon;
revoke all on function public.unlink_partner(uuid) from public, anon;
grant execute on function public.create_partner_invite() to authenticated;
grant execute on function public.accept_partner_invite(text) to authenticated;
grant execute on function public.unlink_partner(uuid) to authenticated;
