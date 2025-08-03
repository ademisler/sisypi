# Sisypi Kurulum Kılavuzu 📦

Bu kılavuz, Sisypi - Web Otomasyon Asistanı v2.0.0 eklentisinin nasıl kurulacağını adım adım açıklar.

## 🎯 Sistem Gereksinimleri

### Desteklenen Tarayıcılar
- **Google Chrome** 88 ve üzeri
- **Microsoft Edge** 88 ve üzeri
- **Chromium** tabanlı diğer tarayıcılar

### Sistem Gereksinimleri
- **İşletim Sistemi:** Windows 10/11, macOS 10.14+, Linux
- **RAM:** Minimum 512 MB (Önerilen: 1 GB)
- **Disk Alanı:** 50 MB boş alan
- **İnternet Bağlantısı:** Gerekli (senaryolar için)

## 🚀 Kurulum Yöntemleri

### Yöntem 1: Chrome Web Store'dan (Yakında)

1. **Chrome Web Store'a gidin**
   - Chrome tarayıcınızı açın
   - [Chrome Web Store](https://chrome.google.com/webstore) adresine gidin

2. **Eklentiyi bulun**
   - Arama kutusuna "Sisypi - Automation Assistant" yazın
   - Arama sonuçlarından eklentiyi seçin

3. **Eklentiyi yükleyin**
   - "Chrome'a Ekle" butonuna tıklayın
   - Çıkan onay penceresinde "Uzantıyı ekle" seçin

### Yöntem 2: Manuel Kurulum (Şu Anda Mevcut)

#### Adım 1: Dosyaları İndirin
1. GitHub repository'den `releases/sisypi-automation-assistant-v2.0.0.zip` dosyasını indirin
2. ZIP dosyasını bilgisayarınızda uygun bir klasöre kaydedin

#### Adım 2: Dosyaları Çıkarın
1. İndirdiğiniz ZIP dosyasına sağ tıklayın
2. "Tümünü ayıkla" veya "Extract All" seçeneğini seçin
3. Çıkarma klasörünü seçin (örn: `C:\Sisypi-Extension\`)
4. Dosyaları çıkarın

#### Adım 3: Chrome'da Geliştirici Modunu Etkinleştirin
1. Chrome tarayıcınızı açın
2. Adres çubuğuna `chrome://extensions/` yazın ve Enter'a basın
3. Sağ üst köşedeki **"Geliştirici modu"** anahtarını etkinleştirin

![Geliştirici Modu](https://via.placeholder.com/600x200/2563eb/ffffff?text=Geliştirici+Modu+Etkinleştirin)

#### Adım 4: Eklentiyi Yükleyin
1. **"Paketlenmemiş öğe yükle"** butonuna tıklayın
2. Dosyaları çıkardığınız klasörü seçin
3. **"Klasörü seç"** butonuna tıklayın

![Eklenti Yükleme](https://via.placeholder.com/600x200/10b981/ffffff?text=Paketlenmemiş+Öğe+Yükle)

#### Adım 5: Kurulumu Doğrulayın
1. Eklentiler sayfasında "Sisypi - Automation Assistant" kartını görmelisiniz
2. Eklenti etkin durumda olmalı (mavi anahtar)
3. Chrome araç çubuğunda Sisypi simgesini görmelisiniz

## ✅ Kurulum Doğrulaması

### 1. Eklenti Simgesini Kontrol Edin
- Chrome araç çubuğunda ⚡ Sisypi simgesini arayın
- Görmüyorsanız, uzantılar simgesine (🧩) tıklayın ve Sisypi'yi sabitleyin

### 2. Eklentiyi Test Edin
1. Sisypi simgesine tıklayın
2. "Yeni Senaryo Oluştur" butonunu görmelisiniz
3. Modern, mavi temalı arayüz açılmalı

### 3. Temel Fonksiyonları Test Edin
1. **Yeni senaryo oluşturun:**
   - "Yeni Senaryo Oluştur" butonuna tıklayın
   - Senaryo adı girin
   - "Kaydet" butonuna tıklayın

2. **Element seçimini test edin:**
   - Herhangi bir web sayfasına gidin
   - "Element Seçerek Adım Ekle" butonuna tıklayın
   - Sayfa elementlerinin numaralı kutularla işaretlendiğini görün

## 🔧 İzinler ve Güvenlik

### Gerekli İzinler
Sisypi aşağıdaki izinleri kullanır:

- **storage** - Senaryoları kaydetmek için
- **activeTab** - Mevcut sekmeyle etkileşim için
- **scripting** - Sayfa scriptlerini çalıştırmak için
- **downloads** - Yedek dosyalarını indirmek için

### Güvenlik Özellikleri
- ✅ Tüm veriler yerel olarak saklanır
- ✅ Üçüncü parti sunuculara veri gönderilmez
- ✅ Kapsamlı güvenlik korumaları aktif
- ✅ Açık kaynak kodlu ve şeffaf

## 🐛 Yaygın Kurulum Sorunları

### Sorun 1: "Manifest dosyası eksik" hatası
**Çözüm:**
- ZIP dosyasını tamamen çıkardığınızdan emin olun
- Doğru klasörü seçtiğinizden emin olun (manifest.json dosyası bulunmalı)

### Sorun 2: Eklenti simgesi görünmüyor
**Çözüm:**
1. Chrome araç çubuğundaki uzantılar simgesine (🧩) tıklayın
2. Sisypi'yi bulun ve pin simgesine tıklayın
3. Simge araç çubuğunda görünecektir

### Sorun 3: "Bu uzantı desteklenmiyor" hatası
**Çözüm:**
- Chrome sürümünüzü güncelleyin (88+ gerekli)
- Geliştirici modunun etkin olduğundan emin olun

### Sorun 4: Element seçimi çalışmıyor
**Çözüm:**
1. Sayfayı yenileyin (F5)
2. Eklentiyi yeniden yükleyin
3. Tarayıcıyı yeniden başlatın

## 🔄 Güncelleme

### Otomatik Güncelleme (Web Store)
- Chrome otomatik olarak güncellemeleri kontrol eder
- Yeni sürümler otomatik yüklenir

### Manuel Güncelleme
1. Yeni sürüm ZIP dosyasını indirin
2. Eski eklentiyi kaldırın (`chrome://extensions/`)
3. Yeni sürümü yukarıdaki adımları takip ederek yükleyin

## 🗑️ Kaldırma

### Eklentiyi Kaldırmak İçin:
1. `chrome://extensions/` adresine gidin
2. Sisypi kartını bulun
3. "Kaldır" butonuna tıklayın
4. Onay penceresinde "Kaldır" seçin

### Verileri Temizlemek İçin:
1. F12 tuşuna basarak Developer Tools'u açın
2. Application sekmesine gidin
3. Storage > Local Storage > chrome-extension://... altında Sisypi verilerini silin

## 🆘 Destek

### Kurulum konusunda yardıma mı ihtiyacınız var?

**GitHub Issues:**
- [GitHub Repository](https://github.com/ademisler/sisypi) üzerinden issue açın
- Sorun detaylarını ve ekran görüntülerini paylaşın

**Email Desteği:**
- contact@ademisler.com adresine yazın
- Konu başlığına "Sisypi Kurulum Sorunu" yazın

**Sistem Bilgilerini Paylaşın:**
- Chrome sürümü (`chrome://version/`)
- İşletim sistemi
- Hata mesajları (varsa)

## 📱 Mobil Cihazlar

**Not:** Sisypi şu anda sadece masaüstü Chrome tarayıcıları için tasarlanmıştır. Mobil cihazlarda çalışmaz.

## 🔐 Güvenlik Notları

### Güvenli Kurulum İçin:
- ✅ Sadece resmi kaynaklardan indirin
- ✅ ZIP dosyasının bütünlüğünü kontrol edin
- ✅ Şüpheli kaynaklardan uzak durun
- ✅ İzinleri dikkatli inceleyin

### Veri Güvenliği:
- 🔒 Tüm senaryolar yerel olarak saklanır
- 🔒 Hassas bilgileri senaryolarda saklamayın
- 🔒 Düzenli yedek alın
- 🔒 Paylaşılan bilgisayarlarda dikkatli olun

---

## ✅ Kurulum Tamamlandı!

Sisypi başarıyla kuruldu! Artık web otomasyonunun gücünü keşfetmeye başlayabilirsiniz.

### Sonraki Adımlar:
1. 📖 [Kullanım Kılavuzu](README.md#kullanım-kılavuzu) bölümünü okuyun
2. 🎬 İlk senaryonuzu oluşturun
3. 🚀 Otomasyonun keyfini çıkarın!

**Başarılı kurulum! Web otomasyonu yolculuğunuz başlıyor! 🎉**