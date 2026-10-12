-- PayPlus Hosted Fields: pending_payment status, shipping amount, provider refs.

alter table orders drop constraint if exists orders_status_check;

alter table orders
  add constraint orders_status_check
  check (status in (
    'pending_payment',
    'pending_whatsapp',
    'in_chat',
    'paid',
    'shipped',
    'completed',
    'cancelled'
  ));

alter table orders alter column status set default 'pending_payment';

alter table orders
  add column if not exists shipping_amount numeric not null default 0 check (shipping_amount >= 0);

alter table orders
  add column if not exists payplus_page_request_uid text;

alter table orders
  add column if not exists payplus_transaction_uid text;

alter table orders
  add column if not exists payplus_status text;

alter table orders
  add column if not exists paid_at timestamptz;

alter table orders
  add column if not exists card_last4 text;

create unique index if not exists orders_payplus_page_request_uid_idx
  on orders (payplus_page_request_uid)
  where payplus_page_request_uid is not null;

grant select (
  shipping_amount,
  payplus_page_request_uid,
  payplus_transaction_uid,
  payplus_status,
  paid_at,
  card_last4
) on orders to authenticated;

drop function if exists create_whatsapp_order(jsonb, text, text);
drop function if exists create_whatsapp_order(jsonb, text, text, text, numeric);

create or replace function create_whatsapp_order(
  p_items jsonb,
  p_currency_code text,
  p_currency_symbol text,
  p_shipping_method text default 'pickup',
  p_shipping_amount numeric default 0
)
returns table(
  order_id uuid,
  order_ref text,
  subtotal numeric,
  discount_percent numeric,
  discount_amount numeric,
  shipping_amount numeric,
  shipping_method text
)
language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid := gen_random_uuid();
  v_order_ref text := 'SS-' || upper(substr(replace(v_order_id::text, '-', ''), 1, 10));
  v_gross numeric;
  v_subtotal numeric;
  v_discount_percent numeric := 0;
  v_discount_amount numeric := 0;
  v_item_count int;
  v_has_prior boolean;
  v_shipping_method text := coalesce(nullif(trim(p_shipping_method), ''), 'pickup');
  v_shipping_amount numeric := greatest(coalesce(p_shipping_amount, 0), 0);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'Invalid cart';
  end if;
  if v_shipping_method not in ('pickup', 'locker', 'courier') then
    raise exception 'Invalid shipping method';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  select exists (
    select 1 from orders
    where orders.user_id = v_user_id and orders.status <> 'cancelled'
  ) into v_has_prior;

  select count(*), coalesce(sum(p.price * i.quantity), 0)
    into v_item_count, v_gross
  from jsonb_to_recordset(p_items) as i(product_id bigint, size text, quantity int)
  join products p on p.id = i.product_id
  where i.quantity between 1 and 99 and p.status not in ('sold', 'reserved', 'draft');
  if v_item_count <> jsonb_array_length(p_items) or v_gross is null then
    raise exception 'Cart contains unavailable products';
  end if;

  if not v_has_prior then
    v_discount_percent := 15;
    v_discount_amount := round(v_gross * 15 / 100, 0);
  end if;
  v_subtotal := v_gross - v_discount_amount;

  insert into orders (
    id, user_id, order_ref, status, currency_code, currency_symbol, subtotal,
    discount_percent, discount_amount, shipping_method, shipping_amount
  )
  values (
    v_order_id, v_user_id, v_order_ref, 'pending_payment', p_currency_code, p_currency_symbol,
    v_subtotal, v_discount_percent, v_discount_amount, v_shipping_method, v_shipping_amount
  );
  insert into order_items (order_id, product_id, product_title, product_slug, product_image, size, quantity, unit_price)
  select v_order_id, p.id, p.title, p.slug, p.img, coalesce(i.size, ''), i.quantity, p.price
  from jsonb_to_recordset(p_items) as i(product_id bigint, size text, quantity int)
  join products p on p.id = i.product_id;
  return query select v_order_id, v_order_ref, v_subtotal, v_discount_percent, v_discount_amount,
    v_shipping_amount, v_shipping_method;
end;
$$;

revoke all on function create_whatsapp_order(jsonb, text, text, text, numeric) from public;
grant execute on function create_whatsapp_order(jsonb, text, text, text, numeric) to authenticated;
