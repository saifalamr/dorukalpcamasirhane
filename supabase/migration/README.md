# Supabase Bölge Taşıma: Sydney → Frankfurt

Sydney'den Türkiye'ye ~300ms gecikme var. Frankfurt ~40–60ms. Bu taşıma sonrası
site tahmini **4–5x daha hızlı** olacak. Tüm adımlar ~30 dakika sürer.

---

## Adım 1 — Yeni Frankfurt projesi oluştur (~5 dk)

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. **Name:** `camasirhane-eu` (herhangi bir isim olur)
3. **Database Password:** güçlü bir şifre ver ve **bir yere kaydet** (gerek olabilir)
4. **Region:** `West EU (London)` değil — **`Central EU (Frankfurt)`** seç
5. Create → proje hazır olana kadar bekle (~2 dk)

## Adım 2 — Şemayı taşı (~2 dk)

1. Yeni projede: **SQL Editor** → New query
2. `supabase/migrations/0001_init.sql` dosyasının içeriğini kopyala-yapıştır → **Run**
   - Sonuç: `Success. No rows returned` — beklenen bu
3. `supabase/seed.sql` **çalıştırma** — demo verisi var, senin gerçek verin 4. adımda gelecek

## Adım 3 — Kullanıcıyı taşı (~2 dk)

1. Yeni projede: **Authentication → Users → Add user → Create new user**
2. E-posta ve şifre: **eski projedekiyle birebir aynı** gir
3. Auto Confirm User: ✅ işaretli olsun

## Adım 4 — Veriyi taşı (~10 dk)

**a) Eski projeden (Sydney) dışa aktar:**
1. Eski proje dashboard → **SQL Editor**
2. `supabase/migration/export-data.sql` içeriğini yapıştır → **Run**
3. 5 sekme açılır; her birinde **tek hücrelik** sonuç var
4. Her hücreye tıkla → tüm metni kopyala (5 blok: customers, products, customer_products, daily_records, daily_record_items)

**b) Yeni projeye (Frankfurt) içe aktar:**
1. Yeni proje → SQL Editor
2. 5 bloğu **sırayla** yapıştır-çalıştır: 1 customers → 2 products → 3 customer_products → 4 daily_records → 5 daily_record_items
3. Sıra önemli çünkü foreign key'ler bu sırada bağlanıyor

## Adım 5 — Doğrula (~2 dk)

1. Yeni projede SQL Editor'de `supabase/migration/verify.sql` çalıştır
2. Satır sayıları eski projeyle aynı mı kontrol et
3. `broken_line_totals` = 0 olmalı

## Adım 6 — Siteyi yeni veritabanına bağla (~2 dk)

1. Yeni proje → **Project Settings → API**
2. **Project URL** ve **anon public** key'i kopyala
3. Proje klasöründeki `.env.local` dosyasını aç, iki satırı değiştir:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YENI-PROJE-ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YENI-ANON-KEY
   ```
4. Kaydet → dev server çalışıyorsa durdur ve yeniden başlat

## Adım 7 — Eski projeyi durdur (en son, her şey çalıştıktan sonra)

1. Birkaç gün yeni projede çalış, her şey yolunda mı bak
2. Eski Sydney projesi → **Project Settings → General → Pause project**
   (Pause ücretlendirmeyi durdurur, veriler 90 gün tutulur — gerektiğinde restore edebilirsin)
3. Tamamen silmek istersen: Settings → General → **Delete project** (geri alınamaz — önce pause et, bir hafta sonra sil)

---

## Sorun giderme

| Sorun | Çözüm |
|---|---|
| `duplicate key value violates unique constraint` | O bloğu iki kez çalıştırmışsın. Yeni projede ilgili tabloyu `truncate` edip bloğu bir kez çalıştır. |
| Import'ta foreign key hatası | Blokları sırayla çalıştırmadın (1→5 sırası şart). |
| Site "Yetkisiz" diyor | Adım 3'teki kullanıcı e-posta/şifresi eskiyle aynı olmalı; ya da `.env.local` eski projeyi gösteriyor. |
| Sayılar tutmuyor | Adım 5'teki verify.sql çıktısını eski projedeki sayılarla karşılaştır; eksik tablonun bloğunu tekrar içe aktar. |

Sorun çıkarsa bana hata mesajını at, çözeriz.
