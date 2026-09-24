# DORUK ALP Çamaşırhane — Kullanım Kılavuzu

Bu sistem, otellerin çamaşırhane hizmetlerini günlük takip etmek, aylık faturalandırmak ve müşterilere rapor göndermek için hazırlanmıştır.

**Site adresi:** https://dorukalpcamasirhane.vercel.app
**Giriş:** E-posta + şifre (her kullanıcı kendi hesabıyla girer)

---

## 1. Günlük İş Akışı (her gün)

### Fiş girişi
1. Soldaki menüden **Günlük Giriş**'e girin
2. Müşteriyi (otel) seçin, tarihi seçin
3. Her malzemenin adedini yazın — fiyatlar otomatik gelir (o otelin anlaşmalı fiyatı)
4. **Kaydet**'e basın. Aynı gün tekrar girerseniz kayıt güncellenir, çift fiş oluşmaz

### Fişleri görüntüleme / silme
- **Günlük Fişler** sayfası: tarihe ve müşteriye göre filtreleyin
- **Görüntüle** → fişin detayı ve yazdırılabilir hâli
- Yanlış fiş **Sil**'e basılarak silinebilir

---

## 2. İrsaliye (fiyatsız teslim fişi)

Otele teslimatta verilecek belge **fiyat göstermez** — sadece malzeme, adet ve tarih.

1. **Günlük Fişler** → fişi **Görüntüle**
2. Sağ üstten **İrsaliye (Fiyatsız)**'a basın
3. **PDF İndir** veya **Yazdır** — çıktıyı teslimatta imzalatın (Teslim Eden / Teslim Alan kutuları var)

> Fiyatlar bu belgede ASLA görünmez. Faturalar aylık raporda gösterilir.

---

## 3. Aylık Faturalama (ay sonunda)

1. Menüden **Aylık Faturalama**'ya girin
2. Müşteri + ay + yıl seçin → **Getir**
3. Ekranda: sevkiyat günü sayısı, toplam adet, tahsil edilen, **Aylık Toplam**
4. **Aylık Rapor Oluştur** → müşteriye gönderilecek fatura raporu açılır

### Raporu müşteriye gönderme
Rapor sayfasında sağ üstte:
- **WhatsApp ile Gönder** → **PDF olarak gönder** veya **Excel olarak gönder** seçin
  - Telefonda: dosya doğrudan WhatsApp paylaşım ekranına gelir → oteli seçin → gönderin
  - Bilgisayarda: dosya iner, "WhatsApp'ı Aç" ile sohbet açılır, dosyayı sohbete sürükleyin
- **PDF İndir / Yazdır** → kağıt çıktı için

> Aylık rapor FİYATLARI ve toplamı GÖSTERİR — bu fatura belgesidir.

---

## 4. Tahsilat (para alınca)

1. Menüden **Tahsilat**'a girin
2. Müşteri ve ay seçin
3. Ödenen tutarı girin, kaydedin
4. Panel'de kalan bakiyeler güncellenir

---

## 5. Müşteri (Otel) Yönetimi

### Yeni otel ekleme
1. **Müşteriler** → **+ Yeni Müşteri**
2. Ad, telefon, adres girin → kaydedin

### Otelin fiyat listesi (ÇOK ÖNEMLİ)
Her otelin **kendi özel fiyatı** vardır:
1. **Müşteriler** → otelin adına tıklayın
2. **Malzemeler ve Fiyatlar** tablosunda her malzemenin fiyatını düzenleyin (yazınca otomatik kaydolur)
3. **Malzeme Ekle** ile yeni malzeme atayın — fiyat kutusuna anlaşılan tutarı yazın

> Fiyatı bugün değiştirirseniz **eski fişler değişmez** — geçmiş ayların hesabı doğru kalır.

---

## 6. Malzemeler

**Malzemeler** sayfasından çamaşırhane ürünlerini (çarşaf, havlu, bornoz...) yönetin. Buradaki fiyat **liste fiyatıdır** — yeni otel eklerken başlangıç olarak kullanılır.

---

## 7. Raporlar

**Raporlar** sayfası: Bugün / Bu Hafta / Bu Ay / Geçen Ay seçenekleriyle toplam gelir, adet, fiş sayısı ve en çok gelir getiren oteller görünür. Belirli bir oteli seçerek kendi raporunu görebilirsiniz; sağdaki **Excel'e Aktar** markalı, gün-gün matris Excel dosyası verir.

---

## 8. Ayarlar

**Ayarlar** sayfasından mağaza bilgileri güncellenir:
- Mağaza adı, etiket, **telefon**, adres, vergi no
- **Logo** yükleme (PNG/JPG — otomatik küçültülür)

Kaydettiğinizde tüm çıktılar (irsaliye, ekstre, fatura raporu, Excel) yeni bilgilerle oluşur. Kod bilgisi gerektirmez.

---

## 9. Dikkat Edilecekler

- **Fiş geçmişi olan müşteri silinemez** — yanlışlıkla veri kaybı imkânsızdır
- Gün değişimi gece yarısından sonra giriş yapılıyorsa **tarihi elle kontrol edin**
- İki kişi aynı anda aynı fişi düzenlerse son kaydeden kazanır — aynı anda aynı fişe girmeyin
- Çıkış yapmak için sol menü altındaki **Çıkış Yap**'ı kullanın (ortak bilgisayarda önemli!)

---

## 10. Sorun Olursa

| Sorun | Çözüm |
|---|---|
| Sayfa açılmıyor | İnterneti kontrol edin, sayfayı yenileyin (F5) |
| Giriş çalışmıyor | Şifreyi yöneticinize sorun — yanlış 5 denemede hesap geçici kilitlenir |
| Fiyat yanlış görünüyor | Müşteri sayfasından o otelin fiyatını düzeltin (geçmiş değişmez) |
| WhatsApp dosya göndermiyor | Dosya inmiştir — "WhatsApp'ı Aç" deyip sohbete elle ekleyin |
| Excel'de ürün eksik | İlgili güne fiş girilmiş mi kontrol edin (Günlük Fişler) |
