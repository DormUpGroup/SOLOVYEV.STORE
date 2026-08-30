-- Clothing subtype for storefront filters: pants / shorts / tshirts / sweaters / jackets

alter table products
  add column if not exists clothing_type text;

alter table products drop constraint if exists products_clothing_type_check;
alter table products add constraint products_clothing_type_check check (
  clothing_type is null
  or clothing_type in ('pants', 'shorts', 'tshirts', 'sweaters', 'jackets')
);

create index if not exists products_clothing_type_idx
  on products (category, clothing_type);

update products set clothing_type = null where category <> 'clothing';

update products
set clothing_type = 'jackets'
where category = 'clothing'
  and title ~* '\y(jacket|parka|shell)\y';

update products
set clothing_type = 'shorts'
where category = 'clothing'
  and clothing_type is null
  and title ~* '\yshorts\y';

update products
set clothing_type = 'sweaters'
where category = 'clothing'
  and clothing_type is null
  and title ~* '\y(hoodie|crewneck|sweatshirt|fleece|waffle)\y';

update products
set clothing_type = 'pants'
where category = 'clothing'
  and clothing_type is null
  and title ~* '\y(pants|jeans)\y';

update products
set clothing_type = 'tshirts'
where category = 'clothing'
  and clothing_type is null
  and (
    title ~* 't-?\s*shirt'
    or title ~* '\y(tee|polo|shirt|long\s*sleeve)\y'
  );
