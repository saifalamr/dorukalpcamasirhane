-- ============================================================
-- 0002: Payment tracking (tahsilat)
-- Actual money received, per customer, optionally tagged to a month.
-- Invoice total for a month = sum of daily_record_items.line_total
-- for records in that month (computed at read time).
-- ============================================================

create table customer_payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  -- The month this payment is attributed to (first day of month).
  -- Payments made "on account" (avans) can target a future/current month.
  period_month date not null,
  paid_at date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_payments_customer_idx on customer_payments (customer_id);
create index customer_payments_period_idx on customer_payments (period_month);

create trigger trg_customer_payments_updated_at before update on customer_payments
  for each row execute function set_updated_at();

alter table customer_payments enable row level security;

create policy "authenticated read customer_payments" on customer_payments for select to authenticated using (true);
create policy "authenticated write customer_payments" on customer_payments for insert to authenticated with check (true);
create policy "authenticated update customer_payments" on customer_payments for update to authenticated using (true);
create policy "authenticated delete customer_payments" on customer_payments for delete to authenticated using (true);
