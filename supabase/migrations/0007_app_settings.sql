-- 0007: Editable store settings (letterhead, brand, logo).
-- Singleton row: id is pinned to 1, so there is always exactly one record.

create table if not exists app_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'DORUK ALP',
  store_tagline text not null default 'Çamaşırhane',
  phone text default '+90 507 403 52 26',
  address text,
  tax_number text,
  -- Data-URL (base64) of the logo image, resized client-side before save.
  logo_url text,
  updated_at timestamptz not null default now()
);

insert into app_settings (id) values (1) on conflict (id) do nothing;

alter table app_settings enable row level security;

drop policy if exists "app_settings read" on app_settings;
create policy "app_settings read"
  on app_settings for select to authenticated using (true);

drop policy if exists "app_settings update" on app_settings;
create policy "app_settings update"
  on app_settings for update to authenticated using (true) with check (true);
