-- Peptide Ledger, ready for people who don't know each other to sign up:
--   1. Anyone can delete their own account. Their log, partner links and codes go with it.
--   2. Partner codes can't be guessed: each account gets 5 wrong codes an hour.
--   3. One account can't fill the database: at most 25,000 entries each.
-- Run it once in the SQL editor after the two earlier migrations. Nothing is dropped.

-- 1. Delete my account ---------------------------------------------------------------------

create function public.delete_my_account()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Sign in first.' using errcode = '28000';
  end if;
  -- ledger_items, partners (both directions), partner_invites and partner_link_attempts
  -- all reference auth.users with on delete cascade, so they go too.
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 2. Partner codes that can't be guessed ---------------------------------------------------

-- Wrong codes entered in the last day, so each account can be limited to 5 an hour.
create table public.partner_link_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  at timestamptz not null default now()
);

create index partner_link_attempts_user_at on public.partner_link_attempts (user_id, at);

alter table public.partner_link_attempts enable row level security;
revoke all on public.partner_link_attempts from anon, authenticated;

-- Replaces accept_partner_invite. It answers {"name": ...} or {"error": ...} instead of raising
-- an error, because raising would also undo the record of the wrong code.
create function public.link_partner(invite_code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  them uuid;
  wrong int;
begin
  if me is null then
    raise exception 'Sign in first.' using errcode = '28000';
  end if;
  select count(*) into wrong
  from public.partner_link_attempts a
  where a.user_id = me and a.at > now() - interval '1 hour';
  if wrong >= 5 then
    return jsonb_build_object('error', 'Too many codes that didn''t work. Wait an hour, then ask your partner for a new code.');
  end if;
  select i.user_id into them
  from public.partner_invites i
  where i.code = upper(regexp_replace(coalesce(invite_code, ''), '[^A-Za-z0-9]', '', 'g'))
    and i.expires_at > now();
  if them is null then
    insert into public.partner_link_attempts (user_id) values (me);
    delete from public.partner_link_attempts a where a.at < now() - interval '1 day';
    return jsonb_build_object('error', 'That code didn''t work. Check it, or ask your partner for a new one (codes last 2 days).');
  end if;
  if them = me then
    return jsonb_build_object('error', 'That''s your own code. Your partner enters it on their account.');
  end if;
  insert into public.partners (user_id, partner_id, partner_name)
  values (me, them, public.account_name(them)), (them, me, public.account_name(me))
  on conflict (user_id, partner_id) do update set partner_name = excluded.partner_name;
  delete from public.partner_invites where user_id = them;
  return jsonb_build_object('name', public.account_name(them));
end;
$$;

revoke all on function public.link_partner(text) from public, anon;
grant execute on function public.link_partner(text) to authenticated;

-- The old version can't count wrong codes, so nobody can call it any more.
revoke execute on function public.accept_partner_invite(text) from authenticated;

-- 3. A size limit per account --------------------------------------------------------------

-- New entries stop at 25,000 per account (years of daily logging). Changes to existing
-- entries, including deleting them, always go through.
create function public.ledger_items_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.ledger_items l
    where l.user_id = new.user_id and l.kind = new.kind and l.id = new.id
  ) then
    if (select count(*) from public.ledger_items l where l.user_id = new.user_id) >= 25000 then
      raise exception 'This log is full: 25,000 entries. Erase some old entries to add new ones.' using errcode = '54000';
    end if;
  end if;
  return new;
end;
$$;

create trigger ledger_items_limit
before insert on public.ledger_items
for each row execute function public.ledger_items_limit();
