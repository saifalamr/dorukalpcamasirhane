-- 0005: Performance indexes for the report/collection pages.
-- Safe to run anytime, on both Sydney and Frankfurt projects.

-- Monthly billing scans filter by date range then group by customer.
create index if not exists daily_records_date_customer_idx
  on daily_records (record_date, customer_id);

-- Tahsilat filters payments by period_month and groups by customer.
create index if not exists customer_payments_month_customer_idx
  on customer_payments (period_month, customer_id);

-- Dashboard "Bekleyen Alacak" scans all history before this month.
create index if not exists daily_records_customer_date_amount_idx
  on daily_records (customer_id, record_date) include (id);

-- Payments for the outstanding-balance rollups.
create index if not exists customer_payments_customer_month_idx
  on customer_payments (customer_id, period_month) include (amount);
