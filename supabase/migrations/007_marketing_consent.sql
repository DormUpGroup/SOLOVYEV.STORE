-- Marketing email consent state + append-only audit log

alter table profiles
  add column if not exists marketing_email_opt_in boolean not null default false;

alter table profiles
  add column if not exists marketing_email_opt_in_at timestamptz;

create table if not exists marketing_consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  granted boolean not null,
  privacy_version text not null,
  source text not null
    check (source in ('registration', 'account')),
  locale text,
  created_at timestamptz not null default now()
);

create index if not exists marketing_consent_events_user_idx
  on marketing_consent_events(user_id, created_at desc);

create index if not exists profiles_marketing_opt_in_idx
  on profiles(marketing_email_opt_in)
  where marketing_email_opt_in = true;

alter table marketing_consent_events enable row level security;

revoke all on marketing_consent_events from public;
revoke insert, update, delete on marketing_consent_events from authenticated;
grant select on marketing_consent_events to authenticated;

drop policy if exists "Users read own marketing consent events" on marketing_consent_events;
create policy "Users read own marketing consent events"
  on marketing_consent_events for select
  using (auth.uid() = user_id);

-- Customers may flip their own marketing preference columns
grant update (display_name, phone, marketing_email_opt_in, marketing_email_opt_in_at)
  on profiles to authenticated;
