-- Realistic demo data drawn from the client's existing Excel files.

insert into products (name, unit) values
  ('Çarşaf Büyük', 'adet'),
  ('Nevresim Büyük', 'adet'),
  ('Büyük Havlu', 'adet'),
  ('Küçük Havlu', 'adet'),
  ('Ayak Havlusu', 'adet'),
  ('Bornoz', 'adet'),
  ('Yastık Alezi', 'adet'),
  ('Traş Havlusu', 'adet'),
  ('Yastık Kılıfı', 'adet'),
  ('Yastık', 'adet'),
  ('Yorgan', 'adet'),
  ('Battaniye', 'adet'),
  ('Pike', 'adet'),
  ('Yatak Örtüsü', 'adet'),
  ('Alez', 'adet'),
  ('Throw', 'adet'),
  ('Minder Kılıfı', 'adet'),
  ('Kırlent Kılıfı', 'adet'),
  ('Masa Örtüsü', 'adet'),
  ('Masa Kapak', 'adet'),
  ('Runner', 'adet'),
  ('Peçete', 'adet'),
  ('Paspas', 'adet'),
  ('Mop', 'adet'),
  ('Tül Perde', 'm2'),
  ('Saten Perde', 'm2'),
  ('SPA B Havlu', 'adet'),
  ('SPA K Havlu', 'adet'),
  ('SPA Peştamal', 'adet');

insert into customers (name) values
  ('DEMİRAY'),
  ('FAROS'),
  ('FAROS TAKSİM'),
  ('STORİA'),
  ('KIZ'),
  ('ERKEK'),
  ('ESEN SPA'),
  ('SÜRMELİ OTEL'),
  ('SANTA'),
  ('OTTOMAN'),
  ('TAKSİM SUİT');

-- Assign a standard hotel/residence textile list to most customers, with per-customer pricing.
insert into customer_products (customer_id, product_id, unit_price)
select c.id, p.id,
  case p.name
    when 'Çarşaf Büyük' then 19.00
    when 'Nevresim Büyük' then 26.00
    when 'Büyük Havlu' then 16.00
    when 'Küçük Havlu' then 9.00
    when 'Ayak Havlusu' then 9.00
    when 'Bornoz' then 30.00
    when 'Yastık Alezi' then 9.00
    when 'Traş Havlusu' then 2.50
    when 'Yastık Kılıfı' then 9.00
    when 'Yastık' then 40.00
    when 'Yorgan' then 75.00
    when 'Battaniye' then 55.00
    when 'Pike' then 30.00
    when 'Yatak Örtüsü' then 30.00
    when 'Alez' then 26.00
    when 'Throw' then 17.00
    when 'Minder Kılıfı' then 16.00
    when 'Kırlent Kılıfı' then 16.00
    when 'Masa Örtüsü' then 33.00
    when 'Masa Kapak' then 20.00
    when 'Runner' then 18.00
    when 'Peçete' then 6.00
    when 'Paspas' then 17.00
    when 'Mop' then 17.00
    else 0
  end
from customers c
cross join products p
where c.name in ('DEMİRAY','FAROS','FAROS TAKSİM','STORİA','SÜRMELİ OTEL','SANTA','OTTOMAN','TAKSİM SUİT')
  and p.unit = 'adet'
  and p.name not like 'SPA%';

-- Esen Spa uses its own item list.
insert into customer_products (customer_id, product_id, unit_price)
select c.id, p.id,
  case p.name
    when 'SPA B Havlu' then 4.00
    when 'SPA K Havlu' then 2.50
    when 'SPA Peştamal' then 6.00
    else 0
  end
from customers c
cross join products p
where c.name = 'ESEN SPA' and p.name in ('SPA B Havlu','SPA K Havlu','SPA Peştamal');

-- KIZ / ERKEK (dormitory wings) use a lighter list.
insert into customer_products (customer_id, product_id, unit_price)
select c.id, p.id,
  case p.name
    when 'Çarşaf Büyük' then 9.00
    when 'Nevresim Büyük' then 13.00
    when 'Yastık Kılıfı' then 3.50
    when 'Battaniye' then 15.00
    else 0
  end
from customers c
cross join products p
where c.name in ('KIZ','ERKEK')
  and p.name in ('Çarşaf Büyük','Nevresim Büyük','Yastık Kılıfı','Battaniye');

-- A few sample daily records for DEMİRAY so the app has something to show immediately.
do $$
declare
  v_customer uuid;
  v_record uuid;
  v_product uuid;
  v_day date;
begin
  select id into v_customer from customers where name = 'DEMİRAY';

  for v_day in select generate_series('2026-08-01'::date, '2026-08-05'::date, '1 day')::date
  loop
    insert into daily_records (customer_id, record_date)
    values (v_customer, v_day)
    returning id into v_record;

    for v_product in
      select p.id from products p
      join customer_products cp on cp.product_id = p.id and cp.customer_id = v_customer
      where p.name in ('Çarşaf Büyük','Nevresim Büyük','Büyük Havlu')
    loop
      insert into daily_record_items (daily_record_id, product_id, quantity, unit_price_snapshot)
      select v_record, v_product,
        (40 + (random() * 20)::int),
        cp.unit_price
      from customer_products cp
      where cp.customer_id = v_customer and cp.product_id = v_product;
    end loop;
  end loop;
end $$;
