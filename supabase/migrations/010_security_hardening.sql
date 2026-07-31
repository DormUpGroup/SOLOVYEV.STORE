-- Security hardening: close public analytics, restrict customer-visible columns,
-- and force marketing consent updates through the server helper (service role).

-- ── analytics_events: no public read/write ──────────────────────────────────
-- Inserts go through Next.js /api/analytics with the service role (bypasses RLS).

drop policy if exists "Public insert analytics" on analytics_events;
drop policy if exists "Public read analytics" on analytics_events;

revoke all on analytics_events from public;
revoke all on analytics_events from anon;
revoke all on analytics_events from authenticated;

-- ── orders: customers cannot read CRM/ops columns via PostgREST ─────────────

revoke select on orders from authenticated;

grant select (
  id,
  user_id,
  order_ref,
  status,
  currency_code,
  currency_symbol,
  subtotal,
  whatsapp_url,
  customer_phone,
  tracking_code,
  shipping_method,
  created_at,
  updated_at
) on orders to authenticated;

-- ── order_status_events: hide internal note / created_by ────────────────────

revoke select on order_status_events from authenticated;

grant select (
  id,
  order_id,
  from_status,
  to_status,
  created_at
) on order_status_events to authenticated;

-- ── profiles: hide CRM tags; marketing columns only via service role ────────

revoke select on profiles from authenticated;
grant select (
  id,
  email,
  display_name,
  phone,
  created_at,
  updated_at,
  marketing_email_opt_in,
  marketing_email_opt_in_at
) on profiles to authenticated;

revoke update on profiles from authenticated;
grant update (display_name, phone) on profiles to authenticated;
