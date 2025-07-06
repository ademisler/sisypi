// --- POPUP ARAYÜZÜNÜN KONTROLCÜSÜ ---
// Bu betik, sadece popup.html'in içindeki arayüz mantığını yönetir.
// Tüm veri işlemleri ve sayfa etkileşimleri için background.js'e mesaj gönderir.

document.addEventListener('DOMContentLoaded', () => {
    // --- DİL METİNLERİ (i18n) ---
    const lang = {
        tr: { appTitle: "Sisypi", yeniSenaryo: "Yeni Senaryo Oluştur", tumunuYedekle: "Tümünü Yedekle", yedektenYukle: "Yedekten Yükle", geri: "Geri", calistir: "Çalıştır", kaydet: "Kaydet", urlKisitlamaEtiket: "URL Kısıtlaması (İsteğe Bağlı)", urlKisitlamaPlaceholder: "örn: google.com/maps", senaryoAdiPlaceholder: "Senaryo Adı", adimEkle: "Element Seçerek Adım Ekle", aracKutusu: "Araç Kutusu", aracBekle: "Bekle", aracYorum: "Yorum", aracGoruntu: "Görüntü", aracEger: "EĞER", aracDegilse: "DEĞİLSE", aracEgerBitti: "EĞER B.", aracDongu: "N Kez", aracDonguBitti: "DÖNGÜ B.", aracKaydir: "Kaydır", modalBaslik: "Eylemi Yapılandır", modalDuzenleBaslik: "Adımı Düzenle", modalHedefElement: "Hedef element:", modalNeYapmakIstersin: "Ne yapmak istersiniz?", modalYazilacakMetin: "Yazılacak Metin (Değişken için {{isim}} kullanın):", modalDegiskeneKaydet: "Kopyalanan değeri değişkene kaydet (isteğe bağlı):", modalDegiskenPlaceholder: "örn: kullaniciAdi", iptal: "İptal", adimiEkle: "Adımı Ekle", degisiklikleriKaydet: "Değişiklikleri Kaydet", eylemTikla: "Tıkla", eylemYaz: "Yaz", eylemKopyala: "Kopyala", senaryoSilOnay: "'{{baslik}}' senaryosunu silmek istediğinize emin misiniz?", yedekYukleOnay: "Mevcut tüm senaryolar silinecek ve yedekten gelenlerle değiştirilecek. Emin misiniz?", yedeklemeBasarili: "Geri yükleme başarılı!", gecersizJson: "Hata: Geçersiz JSON dosyası.", promptBekleme: "Bekleme süresi (ms):", promptYorum: "Yorum metni:", promptTekrar: "Tekrar sayısı:", promptIf: "Kontrol edilecek elementin seçicisi:", durumCalisiyor: "Senaryo çalıştırılıyor...", durumBasarili: "Senaryo başarıyla tamamlandı!", hataUrlUyusmuyor: "Hata: Senaryonun URL kısıtlaması ('{{kisitlama}}') mevcut sayfa adresiyle uyuşmuyor.", hataSeciciBulunamadi: "Seçici bulunamadı: {{secici}}", hataGenel: "Hata (Adım {{adim}}): {{mesaj}}", isimsizSenaryo: "İsimsiz Senaryo" },
        en: { appTitle: "Sisypi", yeniSenaryo: "Create New Scenario", tumunuYedekle: "Backup All", yedektenYukle: "Restore from Backup", geri: "Back", calistir: "Run", kaydet: "Save", urlKisitlamaEtiket: "URL Constraint (Optional)", urlKisitlamaPlaceholder: "e.g., google.com/maps", senaryoAdiPlaceholder: "Scenario Name", adimEkle: "Add Step by Selecting Element", aracKutusu: "Toolbox", aracBekle: "Wait", aracYorum: "Comment", aracGoruntu: "Image", aracEger: "IF", aracDegilse: "ELSE", aracEgerBitti: "ENDIF", aracDongu: "N Times", aracDonguBitti: "ENDL", aracKaydir: "Scroll", modalBaslik: "Configure Action", modalDuzenleBaslik: "Edit Step", modalHedefElement: "Target element:", modalNeYapmakIstersin: "What would you like to do?", modalYazilacakMetin: "Text to type (use {{name}} for variables):", modalDegiskeneKaydet: "Save copied value to a variable (optional):", modalDegiskenPlaceholder: "e.g., userName", iptal: "Cancel", adimiEkle: "Add Step", degisiklikleriKaydet: "Save Changes", eylemTikla: "Click", eylemYaz: "Type", eylemKopyala: "Copy", senaryoSilOnay: "Are you sure you want to delete the '{{baslik}}' scenario?", yedekYukleOnay: "All current scenarios will be deleted and replaced with the backup. Are you sure?", yedeklemeBasarili: "Restore successful!", gecersizJson: "Error: Invalid JSON file.", promptBekleme: "Wait duration (ms):", promptYorum: "Comment text:", promptTekrar: "Number of repetitions:", promptIf: "Selector of the element to check:", durumCalisiyor: "Scenario running...", durumBasarili: "Scenario completed successfully!", hataUrlUyusmuyor: "Error: Scenario's URL constraint ('{{kisitlama}}') does not match the current page URL.", hataSeciciBulunamadi: "Selector not found: {{secici}}", hataGenel: "Error (Step {{adim}}): {{mesaj}}", isimsizSenaryo: "Untitled Scenario" }
    };

    // --- UYGULAMA DURUMU & VERİLER (POPUP'A ÖZEL) ---
    let senaryolar = {};
    let aktifModalDurumu = {};
    let aktifDilMetinleri = lang.tr;
    let appState = {}; // background'dan gelen UI durumu

    // --- ELEMENT REFERANSLARI ---
    const tumElementReferanslari = {
        anaGorunum: document.getElementById('ana-gorunum'), editorGorunumu: document.getElementById('editor-gorunumu'),
        senaryoListesiKonteyner: document.getElementById('senaryo-listesi'), adimlarKonteyner: document.getElementById('adimlar-konteyner'),
        senaryoAdiInput: document.getElementById('senaryo-adi-input'), senaryoUrlInput: document.getElementById('senaryo-url-input'),
        yeniSenaryoBtn: document.getElementById('yeni-senaryo-btn'), anaMenuyeDonBtn: document.getElementById('ana-menuye-don-btn'),
        senaryoKaydetBtn: document.getElementById('senaryo-kaydet-btn'), senaryoCalistirBtn: document.getElementById('senaryo-calistir-btn'),
        adimEkleBtn: document.getElementById('adim-ekle-btn'), aracKutusu: document.querySelector('.arac-kutusu-butonlari'),
        yedekleBtn: document.getElementById('yedekle-btn'), geriYukleBtn: document.getElementById('geri-yukle-btn'), geriYukleInput: document.getElementById('geri-yukle-input'),
        durumCubugu: document.getElementById('calistirma-durum-cubugu'), eylemModalKonteyner: document.getElementById('eylem-modal-konteyner'),
        modalBaslik: document.getElementById('modal-baslik'), modalSeciciGosterim: document.getElementById('modal-secici-gosterim'),
        modalElementDetaylari: document.getElementById('modal-element-detaylari'), // Yeni eklenecek element
        eylemSecenekleri: document.getElementById('eylem-secenekleri'), metinParametreAlani: document.getElementById('metin-parametre-alani'),
        metinInput: document.getElementById('metin-input'), degiskenParametreAlani: document.getElementById('degisken-parametre-alani'),
        degiskenInput: document.getElementById('degisken-input'), modalOnaylaBtn: document.getElementById('modal-onayla-btn'),
        modalIptalBtn: document.getElementById('modal-iptal-btn'), dilTrBtn: document.getElementById('dil-tr-btn'), dilEnBtn: document.getElementById('dil-en-btn')
    };

    const { adimlarKonteyner, senaryoAdiInput, senaryoUrlInput } = tumElementReferanslari;

    // --- ÇEKİRDEK UI FONKSİYONLARI ---
    const gorunumuGoster = (gorunum) => {
        tumElementReferanslari.anaGorunum.style.display = 'none';
        tumElementReferanslari.editorGorunumu.style.display = 'none';
        gorunum.style.display = 'flex';
    };

    const metinleriUygula = (dilKodu) => {
        aktifDilMetinleri = lang[dilKodu] || lang.tr;
        document.documentElement.lang = dilKodu;
        document.querySelectorAll('[data-lang]').forEach(el => {
            const key = el.dataset.lang;
            if (aktifDilMetinleri[key]) {
                const iconHTML = el.querySelector('i, b')?.outerHTML || '';
                el.innerHTML = `${iconHTML} ${aktifDilMetinleri[key]}`.trim();
            }
        });
        document.querySelectorAll('[data-lang-placeholder]').forEach(el => {
            el.placeholder = aktifDilMetinleri[el.dataset.langPlaceholder] || el.placeholder;
        });
        document.querySelectorAll('[data-lang-title]').forEach(el => {
            el.title = aktifDilMetinleri[el.dataset.langTitle] || el.title;
        });
    };

    const durumuAyarla = (mesaj, tip) => {
        tumElementReferanslari.durumCubugu.textContent = mesaj;
        tumElementReferanslari.durumCubugu.className = tip;
        tumElementReferanslari.durumCubugu.style.display = 'block';
    };

    const durumuTemizle = () => {
        tumElementReferanslari.durumCubugu.style.display = 'none';
        tumElementReferanslari.senaryoCalistirBtn.disabled = false;
    };

    // --- DOM YÖNETİMİ ---
    const adimEkleDOM = (veri) => {
        const el = document.createElement('div');
        el.className = 'adim-karti';
        el.innerHTML = `<span class="tutanak" data-lang-title="surukle"><i class="fa-solid fa-grip-vertical"></i></span><div class="ikon"></div><div class="detaylar"></div><div class="adim-eylemleri"><button class="btn-ikon duzenle-btn" data-lang-title="duzenle"><i class="fa-solid fa-pencil"></i></button><button class="btn-ikon sil-btn" data-lang-title="sil"><i class="fa-solid fa-trash"></i></button></div>`;
        adimGuncelleDOM(el, veri);
        adimlarKonteyner.appendChild(el);
        girintileriGuncelle();
    };

    const adimGuncelleDOM = (el, veri) => {
        el.dataset.adimVerisi = JSON.stringify(veri);
        const { ikonSinifi, detaylarHTML, ikonRengi, blokMu } = adimIceriginiOlustur(veri);
        el.classList.toggle('adim-yorum', veri.tip === 'comment');
        el.classList.toggle('adim-blok', blokMu);
        el.querySelector('.ikon').innerHTML = `<i class="${ikonSinifi}"></i>`;
        el.querySelector('.ikon').style.color = ikonRengi;
        el.querySelector('.detaylar').innerHTML = detaylarHTML;
    };
    
    const adimIceriginiOlustur = (veri) => {
        let iS = '', dH = '', iR = 'var(--primary-color)', bM = false;
        const v = veri.elementData && veri.elementData.selector ? `<span class="eylem-degeri">${veri.elementData.selector}</span>` : (veri.deger ? `<span class="eylem-degeri">${veri.deger}</span>` : '');
        switch (veri.tip) {
            case 'tıkla': iS = 'fa-solid fa-hand-pointer'; dH = `<b>${aktifDilMetinleri.eylemTikla}:</b> ${v}`; break;
            case 'yaz': iS = 'fa-solid fa-keyboard'; dH = `<b>${aktifDilMetinleri.eylemYaz}:</b> <span class="eylem-degeri">${veri.metin || ""}</span> <i>içine</i> ${v}`; break;
            case 'kopyala': iS = 'fa-solid fa-copy'; dH = `<b>${aktifDilMetinleri.eylemKopyala}:</b> ${v}`; if (veri.degisken) dH += ` <i class="fa-solid fa-arrow-right-long" style="margin:0 4px;"></i> <span class="degisken-etiketi">${veri.degisken}</span>`; break;
            case 'wait': iS = 'fa-solid fa-clock'; dH = `<b>${aktifDilMetinleri.aracBekle}:</b> ${veri.ms || '1000'}ms`; break;
            case 'comment': iS = 'fa-solid fa-comment-dots'; iR = 'var(--comment-color)'; dH = `${veri.metin || '...'}`; break;
            case 'screenshot': iS = 'fa-solid fa-camera'; dH = `<b>${aktifDilMetinleri.aracGoruntu}</b>`; break;
            case 'scroll': iS = 'fa-solid fa-arrows-down-to-line'; dH = `<b>${aktifDilMetinleri.aracKaydir}</b>`; break;
            case 'if_start': iS = 'fa-solid fa-question'; iR = 'var(--block-color)'; bM = true; dH = `<b>${aktifDilMetinleri.aracEger}</b> ${v} <b>VARSA</b>`; break;
            case 'else_block': iS = 'fa-solid fa-arrows-split-up-and-left'; iR = 'var(--block-color)'; bM = true; dH = `<b>${aktifDilMetinleri.aracDegilse}</b>`; break;
            case 'if_end': iS = 'fa-solid fa-check-double'; iR = 'var(--block-color)'; bM = true; dH = `<b>${aktifDilMetinleri.aracEgerBitti}</b>`; break;
            case 'loop_start': iS = 'fa-solid fa-repeat'; iR = 'var(--block-color)'; bM = true; dH = `<b>${aktifDilMetinleri.aracDongu}</b> (${veri.sayi || 'N'})`; break;
            case 'loop_end': iS = 'fa-solid fa-circle-stop'; iR = 'var(--block-color)'; bM = true; dH = `<b>${aktifDilMetinleri.aracDonguBitti}</b>`; break;
            default: iS = 'fa-solid fa-question-circle'; dH = `Bilinmeyen Eylem`;
        }
        return { ikonSinifi: iS, detaylarHTML: dH, ikonRengi: iR, blokMu: bM };
    };

    const girintileriGuncelle = () => {
        let seviye = 0;
        adimlarKonteyner.querySelectorAll('.adim-karti').forEach(el => {
            const tip = JSON.parse(el.dataset.adimVerisi).tip;
            if (['else_block', 'if_end', 'loop_end'].includes(tip)) {
                seviye = Math.max(0, seviye - 1);
            }
            el.className = el.className.replace(/ girinti-\d/g, '');
            if (seviye > 0) {
                el.classList.add(`girinti-${Math.min(seviye, 2)}`);
            }
            if (['if_start', 'loop_start'].includes(tip)) {
                seviye++;
            }
        });
    };

    const senaryoListesiniDoldur = () => {
        const { senaryoListesiKonteyner } = tumElementReferanslari;
        senaryoListesiKonteyner.innerHTML = '';
        Object.keys(senaryolar).sort().forEach(anahtar => {
            const kart = document.createElement('div');
            kart.className = 'senaryo-karti';
            kart.dataset.senaryoAnahtari = anahtar;
            kart.innerHTML = `<div style="flex-grow:1;"><h3>${senaryolar[anahtar].baslik || 'İsimsiz'}</h3></div><button class="btn-ikon sil-btn" data-lang-title="sil"><i class="fa-solid fa-trash"></i></button>`;
            senaryoListesiKonteyner.appendChild(kart);
        });
        metinleriUygula(document.documentElement.lang);
    };

    const senaryoDuzenle = (anahtar) => {
        const senaryo = senaryolar[anahtar];
        if (!senaryo) {
            // Senaryo bulunamazsa ana menüye dön
            chrome.runtime.sendMessage({ action: 'updateAppState', data: { currentView: 'main', activeScenarioId: null } });
            gorunumuGoster(tumElementReferanslari.anaGorunum);
            return;
        }
        
        appState.activeScenarioId = anahtar;
        senaryoAdiInput.value = senaryo.baslik;
        senaryoUrlInput.value = senaryo.urlKisitlamasi || "";
        adimlarKonteyner.innerHTML = '';
        senaryo.adimlar.forEach(adimEkleDOM);
        gorunumuGoster(tumElementReferanslari.editorGorunumu);
        durumuTemizle();
        girintileriGuncelle();
        chrome.runtime.sendMessage({ action: 'updateAppState', data: { currentView: 'editor', activeScenarioId: anahtar } });
    };

    // --- Modal Yönetimi ---
    const modalGoster = (ayarlar) => {
        console.log("Popup: modalGoster called with settings:", ayarlar);
        const { modalBaslik, modalOnaylaBtn, modalSeciciGosterim, modalElementDetaylari, eylemSecenekleri, metinParametreAlani, degiskenParametreAlani, metinInput, degiskenInput, eylemModalKonteyner } = tumElementReferanslari;
        aktifModalDurumu = ayarlar;
        modalBaslik.textContent = ayarlar.mod === 'duzenle' ? aktifDilMetinleri.modalDuzenleBaslik : aktifDilMetinleri.modalBaslik;
        modalOnaylaBtn.textContent = ayarlar.mod === 'duzenle' ? aktifDilMetinleri.degisiklikleriKaydet : aktifDilMetinleri.adimiEkle;
        
        // Display element details
        if (ayarlar.secici && typeof ayarlar.secici === 'object') {
            modalSeciciGosterim.textContent = ayarlar.secici.selector;
            let detailsHtml = `<b>Tag:</b> ${ayarlar.secici.tagName}`; 
            if (ayarlar.secici.id) detailsHtml += `<br><b>ID:</b> ${ayarlar.secici.id}`;
            if (ayarlar.secici.name) detailsHtml += `<br><b>Name:</b> ${ayarlar.secici.name}`;
            if (ayarlar.secici.value !== null) detailsHtml += `<br><b>Value:</b> ${ayarlar.secici.value}`;
            if (ayarlar.secici.textContent) detailsHtml += `<br><b>Text:</b> ${ayarlar.secici.textContent}`;
            if (ayarlar.secici.placeholder) detailsHtml += `<br><b>Placeholder:</b> ${ayarlar.secici.placeholder}`;
            modalElementDetaylari.innerHTML = detailsHtml;
        } else {
            modalSeciciGosterim.textContent = ayarlar.secici || '';
            modalElementDetaylari.innerHTML = '';
        }

        eylemSecenekleri.innerHTML = '';
        [metinParametreAlani, degiskenParametreAlani].forEach(el => el.style.display = 'none');
        metinInput.value = '';
        degiskenInput.value = '';
        modalOnaylaBtn.disabled = true;
        [{ id: 'tıkla', t: 'eylemTikla' }, { id: 'yaz', t: 'eylemYaz' }, { id: 'kopyala', t: 'eylemKopyala' }].forEach(e => {
            const b = document.createElement('button');
            b.textContent = aktifDilMetinleri[e.t];
            b.dataset.eylem = e.id;
            b.onclick = () => modaldaEylemSec(e.id);
            eylemSecenekleri.appendChild(b);
        });
        if (ayarlar.mod === 'duzenle') {
            modaldaEylemSec(ayarlar.tip);
            metinInput.value = ayarlar.metin || '';
            degiskenInput.value = ayarlar.degisken || '';
        }
        eylemModalKonteyner.style.display = 'flex';
    };

    const modaldaEylemSec = (eylem) => {
        const { modalOnaylaBtn, eylemSecenekleri, metinParametreAlani, degiskenParametreAlani } = tumElementReferanslari;
        aktifModalDurumu.tip = eylem;
        modalOnaylaBtn.disabled = false;
        Array.from(eylemSecenekleri.children).forEach(b => b.classList.toggle('aktif', b.dataset.eylem === eylem));
        metinParametreAlani.style.display = eylem === 'yaz' ? 'block' : 'none';
        degiskenParametreAlani.style.display = eylem === 'kopyala' ? 'block' : 'none';
    };

    const modalEyleminiOnayla = () => {
        const { metinInput, degiskenInput } = tumElementReferanslari;
        const yeniVeri = {
            tip: aktifModalDurumu.tip,
            deger: aktifModalDurumu.secici.selector, // Use the selector string for the 'deger' property
            elementData: aktifModalDurumu.secici, // Store the full elementData object
            metin: metinInput.value,
            degisken: degiskenInput.value
        };
        if (aktifModalDurumu.mod === 'duzenle') {
            adimGuncelleDOM(aktifModalDurumu.adimElementi, yeniVeri);
        } else {
            adimEkleDOM(yeniVeri);
        }
        modaliKapat();
    };

    const modaliKapat = () => tumElementReferanslari.eylemModalKonteyner.style.display = 'none';
    
    // --- VERİ İŞLEMLERİ (BACKGROUND SCRIPT İLE İLETİŞİM) ---
    const mevcutSenaryoyuKaydet = () => {
        if (!appState.activeScenarioId) return;
        const veriler = Array.from(adimlarKonteyner.children).map(el => JSON.parse(el.dataset.adimVerisi));
        const guncelSenaryo = {
            ...senaryolar[appState.activeScenarioId],
            id: appState.activeScenarioId,
            baslik: senaryoAdiInput.value || aktifDilMetinleri.isimsizSenaryo,
            urlKisitlamasi: senaryoUrlInput.value,
            adimlar: veriler
        };
        senaryolar[appState.activeScenarioId] = guncelSenaryo;
        chrome.runtime.sendMessage({ action: 'saveScenarios', data: senaryolar });
        senaryoListesiniDoldur(); // Anında UI güncellemesi için
    };

    // --- OLAY DİNLEYİCİLERİ ---
    const { yeniSenaryoBtn, anaMenuyeDonBtn, senaryoKaydetBtn, senaryoCalistirBtn, adimEkleBtn, modalOnaylaBtn, modalIptalBtn, senaryoListesiKonteyner, aracKutusu, yedekleBtn, geriYukleBtn, geriYukleInput, dilTrBtn, dilEnBtn } = tumElementReferanslari;

    yeniSenaryoBtn.addEventListener('click', () => {
        const k = `senaryo_${Date.now()}`;
        senaryolar[k] = { id: k, baslik: aktifDilMetinleri.isimsizSenaryo, urlKisitlamasi: "", adimlar: [] };
        chrome.runtime.sendMessage({ action: 'saveScenarios', data: senaryolar }, () => {
             senaryoDuzenle(k);
        });
    });

    anaMenuyeDonBtn.addEventListener('click', () => {
        mevcutSenaryoyuKaydet();
        chrome.runtime.sendMessage({ action: 'updateAppState', data: { currentView: 'main', activeScenarioId: null } });
        gorunumuGoster(tumElementReferanslari.anaGorunum);
    });

    senaryoKaydetBtn.addEventListener('click', mevcutSenaryoyuKaydet);
    
    senaryoCalistirBtn.addEventListener('click', () => {
        mevcutSenaryoyuKaydet();
        tumElementReferanslari.senaryoCalistirBtn.disabled = true;
        // Pass the entire scenarios object to ensure background script has the latest data
        chrome.runtime.sendMessage({ action: 'runScenario', scenarioId: appState.activeScenarioId, allScenarios: senaryolar });
    });

    adimEkleBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'startSelectionMode' });
        window.close(); // Popup'ı kapatarak kullanıcının sayfayı görmesini sağla
    });

    modalOnaylaBtn.addEventListener('click', modalEyleminiOnayla);
    modalIptalBtn.addEventListener('click', modaliKapat);

    senaryoListesiKonteyner.addEventListener('click', (e) => {
        const kart = e.target.closest('.senaryo-karti');
        if (!kart) return;
        const anahtar = kart.dataset.senaryoAnahtari;
        if (e.target.closest('.sil-btn')) {
            e.stopPropagation();
            if (confirm(aktifDilMetinleri.senaryoSilOnay.replace('{{baslik}}', senaryolar[anahtar].baslik))) {
                delete senaryolar[anahtar];
                chrome.runtime.sendMessage({ action: 'saveScenarios', data: senaryolar });
                senaryoListesiniDoldur();
            }
        } else {
            senaryoDuzenle(anahtar);
        }
    });

    adimlarKonteyner.addEventListener('click', (e) => {
        const el = e.target.closest('.adim-karti');
        if (!el) return;
        const v = JSON.parse(el.dataset.adimVerisi);
        if (e.target.closest('.sil-btn')) {
            el.remove();
            girintileriGuncelle();
        } else if (e.target.closest('.duzenle-btn')) {
            if (['tıkla', 'yaz', 'kopyala'].includes(v.tip)) {
                modalGoster({ mod: 'duzenle', adimElementi: el, ...v });
            } else {
                let yD;
                if (v.tip === 'wait') yD = prompt(aktifDilMetinleri.promptBekleme, v.ms);
                else if (v.tip === 'comment') yD = prompt(aktifDilMetinleri.promptYorum, v.metin);
                else if (v.tip === 'loop_start') yD = prompt(aktifDilMetinleri.promptTekrar, v.sayi);
                else if (v.tip === 'if_start') yD = prompt(aktifDilMetinleri.promptIf, v.deger);
                
                if (yD !== null) {
                    if (v.tip === 'wait') v.ms = yD;
                    else if (v.tip === 'comment') v.metin = yD;
                    else if (v.tip === 'loop_start') v.sayi = yD;
                    else if (v.tip === 'if_start') v.deger = yD;
                    adimGuncelleDOM(el, v);
                }
            }
        }
    });

    aracKutusu.addEventListener('click', (e) => {
        const b = e.target.closest('.arac-btn');
        if (!b) return;
        const ey = b.dataset.eylem;
        let v = { tip: ey };
        if (ey === 'wait') v.ms = prompt(aktifDilMetinleri.promptBekleme, 1000) || 1000;
        else if (ey === 'comment') v.metin = prompt(aktifDilMetinleri.promptYorum, '');
        else if (ey === 'loop_start') v.sayi = prompt(aktifDilMetinleri.promptTekrar, 3) || 3;
        else if (ey === 'if_start') v.deger = prompt(aktifDilMetinleri.promptIf, '');
        adimEkleDOM(v);
    });

    yedekleBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'backupAll' });
    });

    geriYukleBtn.addEventListener('click', () => geriYukleInput.click());

    geriYukleInput.addEventListener('change', (e) => {
        const dosya = e.target.files[0];
        if (!dosya) return;
        const okuyucu = new FileReader();
        okuyucu.onload = (ev) => {
            try {
                const yeniSenaryolar = JSON.parse(ev.target.result);
                if (confirm(aktifDilMetinleri.yedekYukleOnay)) {
                    chrome.runtime.sendMessage({ action: 'restoreFromBackup', data: yeniSenaryolar }, (response) => {
                        if (response.success) {
                            senaryolar = response.scenarios;
                            senaryoListesiniDoldur();
                            alert(aktifDilMetinleri.yedeklemeBasarili);
                        }
                    });
                }
            } catch (h) {
                alert(aktifDilMetinleri.gecersizJson);
            }
        };
        okuyucu.readAsText(dosya);
        e.target.value = '';
    });
    
    const changeLanguage = (dilKodu) => {
        metinleriUygula(dilKodu);
        chrome.runtime.sendMessage({ action: 'saveLanguage', data: dilKodu });
    };

    dilTrBtn.addEventListener('click', () => changeLanguage('tr'));
    dilEnBtn.addEventListener('click', () => changeLanguage('en'));

    // --- ARKA PLAN SCRIPT'İNDEN GELEN MESAJLARI DİNLE ---
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateRunStatus') {
            const { type, messageKey, params } = request.status;
            let message = aktifDilMetinleri[messageKey] || 'Bilinmeyen durum';
            if (params) {
                Object.keys(params).forEach(key => {
                    message = message.replace(`{{${key}}}`, params[key]);
                });
            }
            durumuAyarla(message, type);
            if(type !== 'calisiyor'){
                tumElementReferanslari.senaryoCalistirBtn.disabled = false;
            }
        }
    });

    // --- BAŞLANGIÇ ---
    const init = () => {
        new Sortable(adimlarKonteyner, { handle: '.tutanak', animation: 150, onEnd: girintileriGuncelle });
        
        // Verileri ve durumu background script'ten al
        chrome.runtime.sendMessage({ action: 'getInitialData' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error getting initial data:", chrome.runtime.lastError.message);
                return;
            }
            if(response) {
                senaryolar = response.scenarios;
                appState = response.appState;
                metinleriUygula(response.language);
                senaryoListesiniDoldur();
                console.log("Popup: Initial appState received from background:", appState);
                
                // Kaydedilen durumu geri yükle
                if (appState.currentView === 'editor' && appState.activeScenarioId && senaryolar[appState.activeScenarioId]) {
                    senaryoDuzenle(appState.activeScenarioId);
                } else {
                    gorunumuGoster(tumElementReferanslari.anaGorunum);
                }

                // Bekleyen bir element seçici var mı kontrol et
                if (appState.pendingSelector) {
                    console.log("Popup: pendingSelector found, showing modal:", appState.pendingSelector);
                    modalGoster({ mod: 'ekle', secici: appState.pendingSelector });
                    // Seçiciyi temizle - modal gösterildikten sonra
                    chrome.runtime.sendMessage({ action: 'updateAppState', data: { pendingSelector: null } }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Error clearing pending selector:", chrome.runtime.lastError.message);
                        }
                    });
                }
            }
        });
    };

    init();
});
