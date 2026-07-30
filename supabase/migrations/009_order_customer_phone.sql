-- Snapshot customer phone on order for admin "Go to chat"

alter table orders add column if not exists customer_phone text;
