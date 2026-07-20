-- Hide draft products (and their images) from anon/public SELECT.
-- Service role (admin + storefront data layer) bypasses RLS.

drop policy if exists "Public read products" on products;
create policy "Public read products" on products
  for select
  using (status is distinct from 'draft');

drop policy if exists "Public read product_images" on product_images;
create policy "Public read product_images" on product_images
  for select
  using (
    exists (
      select 1
      from products p
      where p.id = product_images.product_id
        and p.status is distinct from 'draft'
    )
  );
