README: Sisypi Chrome Eklentisini Oluşturma Talimatları
Bu projenin amacı, ref.html dosyasını görsel bir referans olarak kullanarak, aşağıda detaylandırılan teknik gereksinimlere uygun, tam fonksiyonel bir "Sisypi" Chrome eklentisi oluşturmaktır.
Ana Referans Dosyası
ref.html: Bu dosya, eklentinin kullanıcı arayüzünün (popup.html) nihai görünümüdür. Üretilecek arayüz, bu dosya ile görsel ve yapısal olarak birebir aynı olmalıdır. Renkler, ikonlar, düzen ve tüm interaktif elementler bu referansa göre kodlanmalıdır.
1. Proje Hedefi ve Temel Fonksiyonlar
Hedef: Kullanıcıların, web sayfaları üzerinde görsel olarak otomasyon senaryoları oluşturmasını, kaydetmesini ve çalıştırmasını sağlayan, kod bilgisi gerektirmeyen bir Chrome eklentisi geliştir.
Temel Modlar: Eklenti üç ana modda çalışmalıdır:
Senaryo Oluşturma Modu (Editör Sekmesi): Kullanıcının web sayfasındaki elementleri seçip onlara eylemler atadığı arayüz.
Senaryo Yürütme Modu (Çalıştır Butonu): Kayıtlı bir senaryonun adımlarını otomatik olarak gerçekleştiren işlev.
Senaryo Yönetim Arayüzü (Kütüphane Sekmesi): Kayıtlı tüm senaryoların listelendiği, düzenlendiği ve yönetildiği bölüm.
2. Bileşenlerin Uygulanması
A. Element Seçici (content.js)
Popup'taki "Yeni Adım" butonuyla tetiklenerek, aktif web sayfasında "seçim modu" başlatılmalıdır.
Fare ile üzerine gelinen DOM elementleri görsel olarak (renkli bir çerçeve ile) vurgulanmalıdır.
Kullanıcı bir elemente tıkladığında, o element için stabil bir CSS Selector üretilmeli ve bu bilgi popup.js'e gönderilerek yeni bir otomasyon adımı oluşturulmalıdır.
B. Popup Arayüzü (popup.js, popup.css)
Adım Yönetimi: Kullanıcılar, ref.html'de görüldüğü gibi adımları ekleyebilmeli, silebilmeli ve isimlerini düzenleyebilmelidir.
Sıralama: Adımlar, sürükle-bırak (drag-and-drop) yöntemiyle yeniden sıralanabilmelidir.
Kontrol Butonları:
"Kaydet": Editördeki mevcut senaryoyu chrome.storage.sync'e kaydetmelidir.
"Çalıştır": Editördeki mevcut senaryoyu aktif sekmede çalıştırmalıdır.
C. Eylem Tipleri (popup.js ve background.js Mantığı)
Aşağıdaki eylemler, dropdown menüsünde bulunmalı ve seçildiğinde ilgili input alanlarını göstermelidir. Her eylem, background.js ve content.js tarafından doğru şekilde yorumlanıp yürütülmelidir:
Click: Belirtilen selector'a sahip elemente tıklar.
Type Text: value alanındaki metni, belirtilen selector'a sahip elemente yazar.
Copy Text: Belirtilen selector'a sahip elementin innerText'ini alır.
Wait: value alanında belirtilen saniye kadar bekler.
Scroll: Sayfayı kaydırır (varsayılan olarak en alta veya bir elemente).
Wait for Element: Belirtilen selector'a sahip element DOM'da görünür olana kadar bekler.
D. Senaryo Yöneticisi (Kütüphane Sekmesi)
chrome.storage.sync'ten okunan tüm kayıtlı senaryolar bu sekmede listelenmelidir.
Her senaryo için Senaryo Adı ve Hedef URL gösterilmelidir.
Her senaryo için şu butonlar fonksiyonel olmalıdır:
Çalıştır: Senaryoyu aktif sekmede başlatır.
Düzenle: Senaryoyu "Editör" sekmesinde açar.
Dışa Aktar (Export): Senaryoyu JSON formatında indirir.
Sil: Senaryoyu chrome.storage.sync'ten kaldırır.
Genel bir "İçe Aktar (Import)" butonu, JSON dosyası yükleyerek yeni senaryo eklemeye olanak tanımalıdır.
E. Senaryo Yürütücü (background.js ve content.js)
"Çalıştır" komutu geldiğinde, senaryo adımları sırayla işlenmelidir.
Her adım yürütülürken, content.js aracılığıyla ilgili element web sayfasında görsel olarak vurgulanmalıdır.
Bir adım başarısız olursa (örn: element bulunamazsa), yürütme durdurulmalı ve kullanıcıya (popup üzerinde) bir hata mesajı gösterilmelidir.