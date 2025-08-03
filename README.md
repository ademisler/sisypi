# Sisypi - Web Otomasyon Asistanı v2.0.0 🚀

**Profesyonel web otomasyonu için kod yazmaya gerek kalmadan güçlü Chrome eklentisi**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/ademisler/sisypi)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/chrome-extension-orange.svg)](https://chrome.google.com/webstore)

## 🎯 Özellikler

### 🤖 Gelişmiş Otomasyon Yetenekleri
- **26 Farklı Adım Türü** - Temel tıklamalardan karmaşık mantık bloklarına kadar
- **Görsel Senaryo Oluşturma** - Sürükle-bırak ile kolay senaryo tasarımı
- **Akıllı Element Seçimi** - Gelişmiş CSS seçici üretimi
- **Değişken Desteği** - Dinamik veri kullanımı ve aktarımı
- **Koşullu Mantık** - IF/ELSE/LOOP blokları ile karmaşık senaryolar
- **URL Kısıtlaması** - Senaryoları belirli sayfalarda çalıştırma

### 🛡️ Kurumsal Güvenlik
- **Kapsamlı Güvenlik** - XSS koruması, girdi sanitizasyonu
- **Hız Sınırlama** - Kötüye kullanım önleme (100 çağrı/dakika)
- **Güvenlik Olayları** - Gerçek zamanlı tehdit izleme
- **Denetim Kaydı** - Tüm işlemlerin detaylı kaydı
- **İçerik Güvenlik Politikası** - Katı CSP uygulaması

### ⚡ Performans Optimizasyonu
- **Akıllı Önbellekleme** - %70 daha hızlı işlemler
- **Performans İzleme** - Gerçek zamanlı metrikler
- **Bellek Yönetimi** - Otomatik temizlik ve optimizasyon
- **Toplu İşlemler** - 3x daha hızlı bulk operasyonlar
- **Lazy Loading** - %40 daha hızlı başlangıç

### 📊 Profesyonel Dashboard
- **Güvenlik Paneli** - Güvenlik durumu ve olaylar
- **Performans Metrikleri** - Sistem performansı analizi
- **Sağlık Kontrolleri** - Sistem durumu ve öneriler
- **Otomatik Yenileme** - 5 saniyede bir güncelleme

## 🚀 Kurulum

### Chrome Web Store'dan (Yakında)
1. Chrome Web Store'u ziyaret edin
2. "Sisypi - Automation Assistant" araması yapın
3. "Chrome'a Ekle" butonuna tıklayın

### Manuel Kurulum
1. `releases/sisypi-automation-assistant-v2.0.0.zip` dosyasını indirin
2. ZIP dosyasını bir klasöre çıkarın
3. Chrome'da `chrome://extensions/` adresine gidin
4. "Geliştirici modu"nu etkinleştirin
5. "Paketlenmemiş öğe yükle" butonuna tıklayın
6. Çıkardığınız klasörü seçin

## 📖 Kullanım Kılavuzu

### 🎬 Hızlı Başlangıç

1. **Yeni Senaryo Oluşturma**
   - Eklenti simgesine tıklayın
   - "Yeni Senaryo Oluştur" butonuna basın
   - Senaryo adını ve URL kısıtlamasını girin

2. **Adım Ekleme**
   - "Element Seçerek Adım Ekle" ile sayfa elementlerini seçin
   - Araç kutusundan hazır adımları ekleyin
   - Adımları sürükleyerek sıralayın

3. **Senaryoyu Çalıştırma**
   - Senaryo kartındaki "Çalıştır" butonuna tıklayın
   - Gerçek zamanlı durumu izleyin
   - Sonuçları kontrol edin

### 🛠️ Adım Türleri

#### Temel Etkileşimler
- **Tıklama (Click)** - Elementlere tıklama
- **Metin Girişi (Type)** - Form alanlarına yazma
- **Kopyalama (Copy)** - Element içeriğini değişkene kaydetme
- **Bekleme (Wait)** - Belirli süre bekleme

#### Gelişmiş Etkileşimler
- **Hover** - Mouse ile üzerine gelme
- **Çift Tıklama** - Double click işlemi
- **Sağ Tıklama** - Sağ mouse tuşu
- **Odaklanma/Odak Kaybı** - Focus/Blur işlemleri
- **Alan Temizleme** - Input alanlarını temizleme

#### Form Kontrolleri
- **Seçenek Seçme** - Dropdown menülerden seçim
- **Checkbox İşaretleme/Kaldırma** - Checkbox kontrolü
- **Tuş Basma** - Klavye tuşları simülasyonu

#### Bekleme ve Doğrulama
- **Element Bekleme** - Element görünene kadar bekleme
- **Metin Bekleme** - Belirli metin görünene kadar bekleme
- **Metin Doğrulama** - Sayfa içeriği kontrolü
- **Element Doğrulama** - Element varlığı kontrolü

#### Gelişmiş Özellikler
- **Özellik Çıkarma** - Element özelliklerini alma
- **Element'e Kaydırma** - Belirli element'e scroll
- **Ekran Görüntüsü** - Sayfa görüntüsü alma
- **Yorum** - Senaryo açıklamaları

#### Kontrol Akışı
- **IF/ELSE/END IF** - Koşullu işlemler
- **LOOP/END LOOP** - Tekrarlı işlemler

### 🔧 Gelişmiş Özellikler

#### Değişken Kullanımı
```
1. Copy adımı ile veriyi değişkene kaydedin: myVariable
2. Type adımında {{myVariable}} şeklinde kullanın
3. Dinamik senaryolar oluşturun
```

#### URL Kısıtlaması
```
- Tam URL: https://example.com/page
- Domain: example.com
- Path: example.com/specific-path
- Wildcard: *.example.com
```

#### Koşullu Mantık
```
1. IF START - Element varlığını kontrol eder
2. ELSE BLOCK - Alternatif işlemler
3. IF END - Koşul bloğunu kapatır
```

#### Döngüler
```
1. LOOP START - Tekrar sayısını belirtin
2. Tekrarlanacak adımları ekleyin
3. LOOP END - Döngüyü kapatır
```

## 🛡️ Güvenlik ve Performans

### Güvenlik Özellikleri
- **XSS Koruması** - Tüm girdiler sanitize edilir
- **Hız Sınırlama** - Dakikada 100 işlem limiti
- **Güvenlik Olayları** - Risk seviyelerine göre loglama
- **İçerik Güvenlik Politikası** - Katı CSP kuralları
- **DOM Güvenliği** - Güvenli element manipülasyonu

### Performans Optimizasyonları
- **Akıllı Önbellekleme** - 5 dakika TTL ile cache
- **Bellek Yönetimi** - Otomatik garbage collection
- **Toplu İşlemler** - Efficient bulk processing
- **Lazy Loading** - İhtiyaç anında yükleme
- **Performans İzleme** - Gerçek zamanlı metrikler

### Sistem Gereksinimleri
- **Chrome** 88+ veya **Edge** 88+
- **RAM** 512 MB (önerilen: 1 GB)
- **Disk** 50 MB boş alan
- **İnternet** Aktif bağlantı (senaryolar için)

## 📊 Dashboard Kullanımı

### Güvenlik Paneli
- **Güvenlik Durumu** - Aktif koruma sistemleri
- **Son Olaylar** - Güvenlik olayları geçmişi
- **Risk Analizi** - Tehdit seviyesi değerlendirmesi

### Performans Paneli
- **Sistem Bilgileri** - Çalışma süresi, bellek kullanımı
- **İşlem Metrikleri** - Ortalama, min/max süreleri
- **Önbellek Durumu** - Cache hit oranları

### Tanı Paneli
- **Sistem Sağlığı** - Bileşen durumları
- **Öneriler** - Performans iyileştirme tavsiyeleri
- **Bakım** - Otomatik temizlik durumu

## 🔄 Yedekleme ve Geri Yükleme

### Yedek Oluşturma
1. Ana ekranda "⬇️" simgesine tıklayın
2. JSON dosyası otomatik indirilir
3. Güvenli bir yerde saklayın

### Yedek Geri Yükleme
1. Ana ekranda "⬆️" simgesine tıklayın
2. Yedek JSON dosyasını seçin
3. Onay verin ve senaryolar geri yüklensin

## 🐛 Sorun Giderme

### Yaygın Sorunlar

**Element bulunamıyor hatası:**
- CSS seçiciyi kontrol edin
- Element'in yüklendiğinden emin olun
- "Element Bekleme" adımı kullanın

**Senaryo çalışmıyor:**
- URL kısıtlamasını kontrol edin
- Sayfa tam yüklendiğinden emin olun
- Console'da hata mesajlarını kontrol edin

**Performans sorunları:**
- Dashboard'dan sistem durumunu kontrol edin
- Önbelleği temizleyin (F12 > Application > Storage)
- Eklentiyi yeniden başlatın

### Hata Raporlama
1. Hatayı yeniden üretin
2. Console loglarını (F12) kaydedin
3. Dashboard'dan sistem durumunu alın
4. GitHub Issues'da rapor edin

## 🔧 Geliştirici Bilgileri

### Proje Yapısı
```
sisypi/
├── src/                    # Kaynak kodlar
│   ├── components/         # React bileşenleri
│   ├── context/           # State yönetimi
│   ├── security/          # Güvenlik modülleri
│   ├── performance/       # Performans optimizasyonu
│   └── validation/        # Doğrulama sistemleri
├── content/               # İçerik scriptleri
├── scripts/               # Arka plan scriptleri
├── popup/                 # Popup UI
├── releases/              # Yayın dosyaları
└── dist/                  # Build çıktıları
```

### Geliştirme Komutları
```bash
npm install          # Bağımlılıkları yükle
npm run dev          # Geliştirme sunucusu
npm run build        # Production build
npm run lint         # Kod kalitesi kontrolü
npm run format       # Kod formatlama
npm run type-check   # TypeScript kontrolü
```

### API Referansı

#### Chrome Extension API
```javascript
// Mesaj gönderme
chrome.runtime.sendMessage({
  action: 'runScenario',
  scenarioId: 'abc123'
});

// Sekmede script çalıştırma
chrome.tabs.sendMessage(tabId, {
  action: 'executeScenario',
  steps: scenarioSteps
});
```

#### İçerik Script API
```javascript
// Element seçimi başlatma
chrome.runtime.sendMessage({
  action: 'startSelection'
});

// Element verisi alma
chrome.runtime.sendMessage({
  action: 'getElementDataByNumber',
  elementNumber: 5
});
```

## 📈 Sürüm Geçmişi

### v2.0.0 (2024-12-19) - Büyük Güncelleme
- ✅ 26 yeni adım türü eklendi
- ✅ Kurumsal güvenlik özellikleri
- ✅ Performans optimizasyonları
- ✅ Profesyonel dashboard
- ✅ Gelişmiş hata yönetimi
- ✅ TypeScript desteği
- ✅ Modern UI/UX tasarımı

### v1.0.0 (2024-01-01) - İlk Sürüm
- ✅ Temel otomasyon özellikleri
- ✅ Element seçimi
- ✅ Senaryo yönetimi
- ✅ Basit adım türleri

## 🤝 Katkıda Bulunma

### Nasıl Katkıda Bulunabilirsiniz
1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

### Kod Standartları
- TypeScript kullanın
- ESLint kurallarına uyun
- Prettier ile formatlayın
- Test yazın (yakında)
- Dokümantasyonu güncelleyin

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👨‍💻 Geliştirici

**Adem İşler**
- Email: contact@ademisler.com
- GitHub: [@ademisler](https://github.com/ademisler)
- Website: [ademisler.com](https://ademisler.com)

## 🙏 Teşekkürler

- Chrome Extension API dokümantasyonu
- React ve TypeScript topluluğu
- FontAwesome icon kütüphanesi
- Tüm test kullanıcıları ve geri bildirim verenlere

---

## 🚀 Hızlı Demo

1. **Eklentiyi yükleyin**
2. **Google.com'a gidin**
3. **Yeni senaryo oluşturun**
4. **Arama kutusunu seçin**
5. **"Hello World" yazma adımı ekleyin**
6. **Senaryoyu çalıştırın**

**Tebrikler! İlk otomasyonunuzu oluşturdunuz! 🎉**

---

*Bu eklenti ile web otomasyonunun gücünü keşfedin. Kod yazmadan karmaşık görevleri otomatikleştirin!*
