-- 0006: Reset movement data before real-history import.
-- DELETES: daily_record_items, daily_records, customer_payments
-- KEEPS:   customers, products, customer_products (prices stay as configured)
--
-- ⚠️ RUN THE BACKUP FIRST: supabase/migration/export-data.sql — save its output.
-- This script is NOT idempotent in the "safe" sense: it erases all fiş history.
--
-- Order matters: items before records (FK), payments anytime.

delete from daily_record_items;
delete from daily_records;
delete from customer_payments;

-- Sanity report: what survived
select 'customers' as table, count(*) from customers
union all select 'products', count(*) from products
union all select 'customer_products', count(*) from customer_products
union all select 'daily_records (should be 0)', count(*) from daily_records
union all select 'daily_record_items (should be 0)', count(*) from daily_record_items
union all select 'customer_payments (should be 0)', count(*) from customer_payments;
