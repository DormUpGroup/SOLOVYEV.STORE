-- CRM foundation: order ops fields, status pipeline, notes, tags, inquiries, tasks

-- ── orders: ops columns ─────────────────────────────────────────────────────

alter table orders add column if not exists admin_notes text;
alter table orders add column if not exists tracking_code text;
alter table orders add column if not exists shipping_method text;
alter table orders add column if not exists assignee text;

-- ── orders: status pipeline ─────────────────────────────────────────────────
-- pending_whatsapp → in_chat → paid → shipped → completed | cancelled
-- Legacy confirmed → in_chat

alter table orders drop constraint if exists orders_status_check;

update orders set status = 'in_chat' where status = 'confirmed';

alter table orders
  add constraint orders_status_check
  check (status in (
    'pending_whatsapp',
    'in_chat',
    'paid',
    'shipped',
    'completed',
    'cancelled'
  ));

-- ── order_status_events ─────────────────────────────────────────────────────

create table if not exists order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_events_order_idx
  on order_status_events(order_id, created_at desc);

-- ── customer_notes ──────────────────────────────────────────────────────────

create table if not exists customer_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists customer_notes_user_idx
  on customer_notes(user_id, created_at desc);

-- ── profiles.tags ───────────────────────────────────────────────────────────

alter table profiles
  add column if not exists tags text[] not null default '{}';

-- ── inquiries ───────────────────────────────────────────────────────────────

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('sell', 'trade', 'other')),
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  message text not null default '',
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'won', 'lost')),
  user_id uuid references auth.users(id) on delete set null,
  source text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inquiries_status_idx
  on inquiries(status, created_at desc);

create index if not exists inquiries_email_idx
  on inquiries(email);

drop trigger if exists inquiries_updated_at on inquiries;
create trigger inquiries_updated_at before update on inquiries
  for each row execute function set_updated_at();

-- ── admin_tasks ─────────────────────────────────────────────────────────────

create table if not exists admin_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  due_at timestamptz,
  user_id uuid references auth.users(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists admin_tasks_due_idx
  on admin_tasks(done, due_at);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Admin writes via service role (bypasses RLS). Customers: read-only where applicable.

alter table order_status_events enable row level security;
alter table customer_notes enable row level security;
alter table inquiries enable row level security;
alter table admin_tasks enable row level security;

revoke all on order_status_events from public;
revoke insert, update, delete on order_status_events from authenticated;
grant select on order_status_events to authenticated;

revoke all on customer_notes from public;
revoke all on customer_notes from authenticated;

revoke all on inquiries from public;
revoke all on inquiries from authenticated;

revoke all on admin_tasks from public;
revoke all on admin_tasks from authenticated;

drop policy if exists "Users read own order status events" on order_status_events;
create policy "Users read own order status events"
  on order_status_events for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_status_events.order_id
        and orders.user_id = auth.uid()
    )
  );
