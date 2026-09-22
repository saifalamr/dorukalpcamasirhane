-- Çamaşırhane (commercial laundry) schema
-- Normalized model: customers, products, customer_products (pricing), daily_records, daily_record_items
-- The Excel-like day/month matrix is generated at query time, never stored as columns.

create extension if not exists "pgcrypto";

-- ========== customers ==========
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_name text,
  phone text,
  address text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index customers_name_unique on customers (lower(name));

-- ========== products ==========
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'adet' check (unit in ('adet', 'm2')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index products_name_unique on products (lower(name));

-- ========== customer_products (assignment + current price) ==========
create table customer_products (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  unit_price numeric(10,2) not null default 0 check (unit_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

-- ========== daily_records (one per customer + date) ==========
create table daily_records (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete restrict,
  record_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, record_date)
);

create index daily_records_date_idx on daily_records (record_date);
create index daily_records_customer_idx on daily_records (customer_id);

-- ========== daily_record_items ==========
create table daily_record_items (
  id uuid primary key default gen_random_uuid(),
  daily_record_id uuid not null references daily_records(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity numeric(10,2) not null check (quantity >= 0),
  unit_price_snapshot numeric(10,2) not null check (unit_price_snapshot >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price_snapshot) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (daily_record_id, product_id)
);

create index daily_record_items_record_idx on daily_record_items (daily_record_id);

-- ========== updated_at triggers ==========
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_customers_updated_at before update on customers
  for each row execute function set_updated_at();
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger trg_customer_products_updated_at before update on customer_products
  for each row execute function set_updated_at();
create trigger trg_daily_records_updated_at before update on daily_records
  for each row execute function set_updated_at();
create trigger trg_daily_record_items_updated_at before update on daily_record_items
  for each row execute function set_updated_at();

-- ========== Row Level Security ==========
-- Single-tenant internal tool: any authenticated (logged-in) user may read/write.
-- Anonymous (unauthenticated) access is blocked entirely.

alter table customers enable row level security;
alter table products enable row level security;
alter table customer_products enable row level security;
alter table daily_records enable row level security;
alter table daily_record_items enable row level security;

create policy "authenticated read customers" on customers for select to authenticated using (true);
create policy "authenticated write customers" on customers for insert to authenticated with check (true);
create policy "authenticated update customers" on customers for update to authenticated using (true);

create policy "authenticated read products" on products for select to authenticated using (true);
create policy "authenticated write products" on products for insert to authenticated with check (true);
create policy "authenticated update products" on products for update to authenticated using (true);

create policy "authenticated read customer_products" on customer_products for select to authenticated using (true);
create policy "authenticated write customer_products" on customer_products for insert to authenticated with check (true);
create policy "authenticated update customer_products" on customer_products for update to authenticated using (true);

create policy "authenticated read daily_records" on daily_records for select to authenticated using (true);
create policy "authenticated write daily_records" on daily_records for insert to authenticated with check (true);
create policy "authenticated update daily_records" on daily_records for update to authenticated using (true);
create policy "authenticated delete daily_records" on daily_records for delete to authenticated using (true);

create policy "authenticated read daily_record_items" on daily_record_items for select to authenticated using (true);
create policy "authenticated write daily_record_items" on daily_record_items for insert to authenticated with check (true);
create policy "authenticated update daily_record_items" on daily_record_items for update to authenticated using (true);
create policy "authenticated delete daily_record_items" on daily_record_items for delete to authenticated using (true);

-- ========== Helper view: daily record with totals ==========
create view daily_records_with_totals as
select
  dr.id,
  dr.customer_id,
  dr.record_date,
  dr.notes,
  coalesce(sum(dri.quantity), 0) as total_quantity,
  coalesce(sum(dri.line_total), 0) as total_amount
from daily_records dr
left join daily_record_items dri on dri.daily_record_id = dr.id
group by dr.id;
