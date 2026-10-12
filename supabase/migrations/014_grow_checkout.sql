-- Grow checkout: process id/token for redirect + callback fulfillment.

alter table orders
  add column if not exists grow_process_id text;

alter table orders
  add column if not exists grow_process_token text;

alter table orders
  add column if not exists grow_transaction_id text;

alter table orders
  add column if not exists grow_status text;

create unique index if not exists orders_grow_process_token_idx
  on orders (grow_process_token)
  where grow_process_token is not null;

grant select (
  grow_process_id,
  grow_process_token,
  grow_transaction_id,
  grow_status
) on orders to authenticated;
