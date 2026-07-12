-- Add made_to_order product status (товары под заказ)

alter table products drop constraint if exists products_status_check;

alter table products add constraint products_status_check check (
  status in ('available', 'reserved', 'sold', 'new_drop', 'draft', 'made_to_order')
);
