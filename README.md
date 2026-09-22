# Çamaşırhane Takip Sistemi

Excel tabanlı günlük/aylık çamaşırhane takibinin yerini alan basit ve hızlı bir web uygulaması.

## Kurulum

1. **Supabase projesi oluşturun** (supabase.com → New Project).
2. SQL Editor'de sırasıyla çalıştırın:
   - `supabase/migrations/0001_init.sql` — tabloları, RLS politikalarını ve tetikleyicileri oluşturur.
   - `supabase/seed.sql` — örnek müşteri/malzeme verisi ve birkaç demo günlük kayıt ekler (isteğe bağlı).
3. Supabase → Authentication → Users kısmından çalışanlar için e-posta/şifre ile en az bir kullanıcı oluşturun (uygulama sadece giriş yapmış kullanıcılara açıktır).
4. `.env.local.example` dosyasını `.env.local` olarak kopyalayıp Supabase proje URL'si ve anon key'i ile doldurun.
5. Bağımlılıkları kurun ve geliştirme sunucusunu başlatın:
   ```bash
   npm install
   npm run dev
   ```
6. Vercel'e dağıtmak için projeyi bir Git deposuna gönderip Vercel'de içe aktarın, aynı ortam değişkenlerini (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) Vercel proje ayarlarına ekleyin.

## Ana Akış

Müşteri seç → Tarih seç → Adet gir → Kaydet → Günlük fiş otomatik oluşur → Ay sonunda **Aylık Rapor**'da Excel benzeri tabloyu görün → **Excel'e Aktar** ile dışa aktarın.

## Klasör Yapısı

- `supabase/migrations/` — veritabanı şeması (normalize: customers, products, customer_products, daily_records, daily_record_items).
- `src/app/(app)/` — giriş yapmış kullanıcıların gördüğü sayfalar (Panel, Günlük Giriş, Günlük Fişler, Aylık Rapor, Müşteriler, Malzemeler).
- `src/app/login/` — giriş sayfası.
- `src/app/api/` — sunucu tarafı route handler'lar (kayıt/silme/excel dışa aktarma).

## Notlar

- Fiyatlar müşteri + malzeme bazında tutulur (`customer_products.unit_price`). Her günlük kayıt satırı, kaydedildiği andaki fiyatı `unit_price_snapshot` olarak saklar — ileride fiyat değişse bile geçmiş fişler değişmez.
- Aylık matriste günler veritabanı sütunu değildir; `daily_record_items` üzerinden anlık hesaplanır.
- Excel içe aktarma (Faz 3) henüz eklenmedi — spesifikasyonda belirtildiği gibi ürün adı eşleştirmesi kullanıcı onayı gerektirdiğinden ayrı bir adımda ele alınmalı.
