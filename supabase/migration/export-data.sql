-- ============================================================
-- DATA EXPORT SCRIPT — run this in the OLD (Sydney) project
-- ============================================================
-- How to use:
--   1. Old project dashboard → SQL Editor → paste this whole file → Run
--   2. You will get 5 result tabs. Each tab has ONE cell containing
--      ready-to-run INSERT statements. Click the cell, copy ALL of it.
--   3. Paste each one (in order: 1 → 5) into the NEW project's SQL
--      Editor and run.
--
-- Nulls, UUIDs, prices and timestamps are handled automatically.
-- ============================================================

-- ============ 1/5 CUSTOMERS ============
select string_agg(
  format(
    'insert into customers (id, name, display_name, phone, address, notes, active, created_at, updated_at) values (%L, %L, %L, %L, %L, %L, %L, %L, %L);',
    id, name, display_name, phone, address, notes, active, created_at, updated_at
  ),
  E'\n'
) as stmts from customers;

-- ============ 2/5 PRODUCTS (malzemeler) ============
select string_agg(
  format(
    'insert into products (id, name, unit, active, created_at, updated_at) values (%L, %L, %L, %L, %L, %L);',
    id, name, unit, active, created_at, updated_at
  ),
  E'\n'
) as stmts from products;

-- ============ 3/5 CUSTOMER PRODUCTS (prices) ============
select string_agg(
  format(
    'insert into customer_products (id, customer_id, product_id, unit_price, active, created_at, updated_at) values (%L, %L, %L, %L, %L, %L, %L);',
    id, customer_id, product_id, unit_price, active, created_at, updated_at
  ),
  E'\n'
) as stmts from customer_products;

-- ============ 4/5 DAILY RECORDS ============
select string_agg(
  format(
    'insert into daily_records (id, customer_id, record_date, notes, created_at, updated_at) values (%L, %L, %L, %L, %L, %L);',
    id, customer_id, record_date, notes, created_at, updated_at
  ),
  E'\n'
) as stmts from daily_records;

-- ============ 5/5 DAILY RECORD ITEMS ============
-- line_total is a generated column, so it is skipped here —
-- the new database recomputes it automatically.
select string_agg(
  format(
    'insert into daily_record_items (id, daily_record_id, product_id, quantity, unit_price_snapshot, created_at, updated_at) values (%L, %L, %L, %L, %L, %L, %L);',
    id, daily_record_id, product_id, quantity, unit_price_snapshot, created_at, updated_at
  ),
  E'\n'
) as stmts from daily_record_items;
