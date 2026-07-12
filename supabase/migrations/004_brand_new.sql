-- Add brand_new product status (новые вещи)

alter table products drop constraint if exists products_status_check;

alter table products add constraint products_status_check check (
  status in ('available', 'reserved', 'sold', 'new_drop', 'draft', 'made_to_order', 'brand_new')
);
