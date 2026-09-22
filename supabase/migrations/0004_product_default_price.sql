-- 0004: Add a default (list) price to each product.
-- customer_products.unit_price stays the per-customer price — this is the
-- catalog-level price used to prefill when assigning a malzeme to a customer.
-- Backfilled from the official DORUK ALP flyer (see 0003_flyer_prices.sql).

alter table products add column default_price numeric(10,2) not null default 0;

update products set default_price = f.price
from (values
  ('Çarşaf Büyük',   19.00),
  ('Nevresim Büyük', 26.00),
  ('Büyük Havlu',    16.00),
  ('Küçük Havlu',     9.00),
  ('Ayak Havlusu',    9.00),
  ('Bornoz',         30.00),
  ('Yastık Alezi',    9.00),
  ('Yastık Kılıfı',   9.00),
  ('Yastık',         40.00),
  ('Yorgan',         75.00),
  ('Battaniye',      55.00),
  ('Pike',           30.00),
  ('Yatak Örtüsü',   30.00),
  ('Alez',           26.00),
  ('Throw',          17.00),
  ('Minder Kılıfı',  16.00),
  ('Kırlent Kılıfı', 16.00),
  ('Masa Örtüsü',    33.00),
  ('Masa Kapak',     20.00),
  ('Runner',         18.00),
  ('Peçete',          6.00),
  ('Paspas',         17.00),
  ('Mop',            17.00),
  ('Tül Perde',      35.00),
  ('Saten Perde',    45.00)
) as f(product_name, price)
where lower(products.name) = lower(f.product_name);

-- SPA items and Traş Havlusu aren't on the flyer; leave them at 0 until set.
