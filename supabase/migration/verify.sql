-- ============================================================
-- VERIFICATION SCRIPT — run in the NEW (Frankfurt) project
-- ============================================================
-- Run this after importing all 5 INSERT blocks. It prints a
-- count for each table — compare against the old project.
--
-- Expected counts (check old project if unsure):
--   customers               = number of your customers (11 in demo data)
--   products                = number of your malzemeler (29 in demo data)
--   customer_products       = one row per customer-product price
--   daily_records           = one per customer+day ever entered
--   daily_record_items      = one per line on every fiş
--
-- Then: open the app, log in, open Günlük Fişler and Aylık Rapor,
-- and confirm the numbers match what you saw before.
-- ============================================================

select 'customers' as tablo, count(*) as satir from customers
union all
select 'products', count(*) from products
union all
select 'customer_products', count(*) from customer_products
union all
select 'daily_records', count(*) from daily_records
union all
select 'daily_record_items', count(*) from daily_record_items
;

-- Sanity check: generated column line_total should be non-zero
-- where quantity and price are non-zero.
select count(*) as broken_line_totals
from daily_record_items
where line_total is distinct from quantity * unit_price_snapshot;
