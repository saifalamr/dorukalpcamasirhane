-- Assign M.Q. OTEL its product list (from 8.M.Q. OTEL AGUSTOS.xlsx) at flyer list prices.
-- Idempotent: on conflict does nothing, safe to re-run.
-- Excel abbreviation -> catalog product mapping:
--   ÇARŞAF->Çarşaf Büyük, NEVRESİM->Nevresim Büyük, B.HAVLU->Büyük Havlu,
--   K.HAVLU->Küçük Havlu, A.HAVLU->Ayak Havlusu, BORNOZ->Bornoz,
--   Y.KILIFI->Yastık Kılıfı, PİKE->Pike, YORGAN->Yorgan, SATEN PERDE->Saten Perde,
--   TÜL PERDE->Tül Perde, PEŞTAMAL->SPA Peştamal, YASTIK->Yastık, ALEZ->Alez,
--   MİDER->Minder Kılıfı

insert into customer_products (customer_id, product_id, unit_price)
select c.id, p.id, p.default_price
from (values
  ('Çarşaf Büyük'),
  ('Nevresim Büyük'),
  ('Büyük Havlu'),
  ('Küçük Havlu'),
  ('Ayak Havlusu'),
  ('Bornoz'),
  ('Yastık Kılıfı'),
  ('Pike'),
  ('Yorgan'),
  ('Saten Perde'),
  ('Tül Perde'),
  ('SPA Peştamal'),
  ('Yastık'),
  ('Alez'),
  ('Minder Kılıfı')
) as v(product_name)
join products p on lower(p.name) = lower(v.product_name)
join customers c on c.name = 'M.Q. OTEL'
on conflict (customer_id, product_id) do nothing;

-- Verify: should show 15 rows with the flyer prices
select p.name, cp.unit_price
from customer_products cp
join customers c on c.id = cp.customer_id
join products p on p.id = cp.product_id
where c.name = 'M.Q. OTEL'
order by p.name;
