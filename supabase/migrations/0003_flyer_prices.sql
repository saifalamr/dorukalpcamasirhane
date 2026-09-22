-- 0003: Apply the official DORUK ALP Çamaşırhane price list (flyer photo).
-- Prices are the flyer's list prices (KDV fiyatlara dahil değildir).
--
-- What it does:
--   1. Adds 'Yastık Alezi' — the one flyer item missing from the catalog.
--   2. Updates unit_price on every existing customer_products assignment to the flyer price.
--
-- What it does NOT do:
--   - It does not touch historical fişler: daily_record_items.unit_price_snapshot
--     freezes the price at entry time, so past records keep their old prices.
--   - It does not auto-assign flyer items to customers who don't have them yet
--     (assign per customer from the Müşteriler detail page if needed).
--   - It overwrites special/negotiated per-customer rates too. If a hotel has a
--     private rate, fix it afterwards on the customer's page (✏️ edit).
--
-- Safe to run more than once. Run it on BOTH the old (Sydney) and the new
-- (Frankfurt) project if you migrate before pausing Sydney.

-- ---------- 1) Product on the flyer that wasn't in the catalog yet ----------
insert into products (name, unit)
select 'Yastık Alezi', 'adet'
where not exists (select 1 from products where lower(name) = lower('Yastık Alezi'));

-- ---------- Flyer price list ----------
create temp table flyer_prices (product_name text, price numeric(10,2));
insert into flyer_prices (product_name, price) values
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
  ('Saten Perde',    45.00);

-- ---------- 2) Remember current prices so we can show a before/after report ----------
create temp table price_changes as
select cp.id,
       c.name        as customer,
       p.name        as product,
       cp.unit_price as old_price
from customer_products cp
join customers c on c.id = cp.customer_id
join products  p on p.id = cp.product_id
join flyer_prices f on lower(f.product_name) = lower(p.name);

-- ---------- 3) Apply the flyer prices ----------
update customer_products cp
set unit_price = f.price,
    updated_at = now()
from flyer_prices f
join products p on lower(p.name) = lower(f.product_name)
where cp.product_id = p.id
  and cp.unit_price <> f.price;

-- ---------- 4) Report ----------
-- 4a. Every price that changed (old → new), per customer
select pc.customer,
       pc.product,
       pc.old_price,
       cp.unit_price as new_price
from price_changes pc
join customer_products cp on cp.id = pc.id
order by pc.customer, pc.product;

-- 4b. Safety check: flyer items with no matching product name in the DB.
--     Should return 0 rows — a row here means a name doesn't match.
select f.product_name as flyer_item_without_product
from flyer_prices f
where not exists (
  select 1 from products p where lower(p.name) = lower(f.product_name)
);

-- 4c. Products that no customer has assigned yet
--     (e.g. the new Yastık Alezi — assign from the Müşteriler detail page)
select p.name as product_without_any_customer
from products p
where not exists (select 1 from customer_products cp where cp.product_id = p.id)
order by p.name;
