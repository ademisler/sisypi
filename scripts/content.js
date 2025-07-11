// --- SAYFA İÇERİĞİYLE ETKİLEŞEN BETİK (CONTENT SCRIPT) ---
// Bu betik, background.js tarafından gerektiğinde web sayfasına enjekte edilir.

(() => {
    // Betiğin birden çok kez enjekte edilmesini önlemek için kontrol
    if (window.sisypiContentScriptInjected) {
        return;
    }
    window.sisypiContentScriptInjected = true;

    let sonVurgulananElement = null;
    let sisypiMarkers = []; // İşaretleyicileri tutmak için yeni dizi

    // --- ELEMENT SEÇİM MODU ---
    const secimModu = {
        baslat: () => {
            console.log("Content Script: Selection mode started.");
            document.body.classList.add('sisypi-secim-modu-aktif');
            // Önceki işaretleyicileri temizle
            sisypiMarkers.forEach(marker => marker.markerDiv.remove());
            sisypiMarkers = [];

            // Eski olay dinleyicilerini kaldır
            document.removeEventListener('mouseover', secimModu.elementiVurgula);
            document.removeEventListener('mouseout', secimModu.vurgulamayiKaldir);
            document.removeEventListener('click', secimModu.elementiSec, { capture: true });

            secimModu.elementleriIsaretle(); // Yeni fonksiyonu çağırarak elementleri işaretle

            // Stilleri sayfaya ekle
            if (!document.getElementById('sisypi-styles')) {
                const style = document.createElement('style');
                style.id = 'sisypi-styles';
                style.textContent = `
                    body.sisypi-secim-modu-aktif, body.sisypi-secim-modu-aktif * { cursor: default !important; } /* İmleci varsayılana ayarla */
                    .sisypi-selection-marker {
                        position: absolute;
                        z-index: 999999;
                        background: #db2777;
                        color: white;
                        border-radius: 50%;
                        width: 24px; /* Biraz daha büyük */
                        height: 24px; /* Biraz daha büyük */
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-size: 14px; /* Daha büyük yazı tipi */
                        cursor: pointer;
                        box-shadow: 0 0 8px rgba(0,0,0,0.6); /* Daha güçlü gölge */
                        transition: transform 0.1s ease-in-out;
                    }
                    .sisypi-selection-marker:hover {
                        transform: scale(1.2); /* Üzerine gelindiğinde büyüme efekti */
                    }
                `;
                document.head.appendChild(style);
            }
        },
        durdur: () => {
            console.log("Content Script: Selection mode stopped.");
            document.body.classList.remove('sisypi-secim-modu-aktif');
            // İşaretleyicileri kaldır
            sisypiMarkers.forEach(marker => marker.markerDiv.remove());
            sisypiMarkers = [];
            // Eski olay dinleyicilerini kaldır
            document.removeEventListener('mouseover', secimModu.elementiVurgula);
            document.removeEventListener('mouseout', secimModu.vurgulamayiKaldir);
            document.removeEventListener('click', secimModu.elementiSec, { capture: true });
        },
        
        elementleriIsaretle: () => {
            const interactiveElements = document.querySelectorAll('a[href], input:not([type="hidden"]), textarea, [contenteditable="true"], p, span, div, h1, h2, h3, h4, h5, h6');
            let markerIndex = 1;
            interactiveElements.forEach(el => {
                // Sadece görünür elementleri işle
                if (el.offsetWidth > 0 || el.offsetHeight > 0) {
                    const rect = el.getBoundingClientRect();
                    const marker = document.createElement('div');
                    marker.classList.add('sisypi-selection-marker');
                    marker.textContent = markerIndex++;
                    marker.style.top = `${rect.top + window.scrollY}px`;
                    marker.style.left = `${rect.left + window.scrollX}px`;

                    document.body.appendChild(marker);
                    sisypiMarkers.push({ markerDiv: marker, targetElement: el }); // Hem işaretleyiciyi hem de hedef elementi sakla
                }
            });
        },
        
        cssSeciciOlustur: (el) => {
            if (!(el instanceof Element)) return '';

            const getUniqueSelector = (element) => {
                if (!(element instanceof Element)) return '';

                // 1. Try ID
                if (element.id) {
                    const selector = `#${element.id.trim()}`;
                    if (document.querySelectorAll(selector).length === 1) {
                        return selector;
                    }
                }

                // 2. Try TagName with specific attributes (name, type, href, src, alt, title, role, aria-label, etc.)
                const tagName = element.tagName.toLowerCase();
                const attributesToTest = [];

                // Common interactive attributes
                if (element.name) attributesToTest.push(`[name="${element.name.trim()}"]`);
                if (element.type && tagName === 'input') attributesToTest.push(`[type="${element.type.trim()}"]`);
                if (element.placeholder) attributesToTest.push(`[placeholder="${element.placeholder.trim()}"]`);
                if (element.href && tagName === 'a') attributesToTest.push(`[href="${element.href.trim()}"]`);
                if (element.src && (tagName === 'img' || tagName === 'iframe')) attributesToTest.push(`[src="${element.src.trim()}"]`);
                if (element.alt && tagName === 'img') attributesToTest.push(`[alt="${element.alt.trim()}"]`);
                if (element.title) attributesToTest.push(`[title="${element.title.trim()}"]`);
                if (element.role) attributesToTest.push(`[role="${element.role.trim()}"]`);
                if (element.getAttribute('aria-label')) attributesToTest.push(`[aria-label="${element.getAttribute('aria-label').trim()}"]`);

                // Data attributes
                for (const attr of element.attributes) {
                    if (attr.name.startsWith('data-')) {
                        attributesToTest.push(`[${attr.name}="${attr.value.trim()}"]`);
                    }
                }

                // Class names (try individual unique classes first, then combined)
                if (element.className) {
                    const classes = element.className.trim().split(/\s+/).filter(cls => cls.length > 0);
                    for (const cls of classes) {
                        const tempSelector = `${tagName}.${cls}`;
                        if (document.querySelectorAll(tempSelector).length === 1) {
                            return tempSelector;
                        }
                    }
                    if (classes.length > 0) {
                        attributesToTest.push(`.${classes.join('.')}`);
                    }
                }

                // Test combinations of tagName and attributes
                for (const attrPart of attributesToTest) {
                    const selector = `${tagName}${attrPart}`;
                    if (document.querySelectorAll(selector).length === 1) {
                        return selector;
                    }
                }

                // 3. Fallback to nth-of-type
                let part = tagName;
                const siblings = Array.from(element.parentElement.children).filter(child => child.tagName === element.tagName);
                if (siblings.length > 1) {
                    const index = siblings.indexOf(element) + 1;
                    part += `:nth-of-type(${index})`;
                }
                return part;
            };

            const path = [];
            let current = el;
            while (current && current !== document.body) {
                path.unshift(getUniqueSelector(current));
                current = current.parentElement;
            }
            return path.join(' > ');
        }
    };

    // --- SENARYO YÜRÜTME MOTORU ---
    const senaryoMotoru = {
        degiskenler: {},
        calisiyor: false,

        bekle: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
        
        waitForElement: (selector, timeout = 10000) => {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                const checkElement = () => {
                    const element = document.querySelector(selector);
                    if (element) {
                        resolve(element);
                    } else if (Date.now() - startTime > timeout) {
                        reject(new Error(`Element with selector "${selector}" not found within ${timeout}ms.`));
                    } else {
                        requestAnimationFrame(checkElement);
                    }
                };
                requestAnimationFrame(checkElement);
            });
        },
        
        durumuGuncelle: (status) => {
            chrome.runtime.sendMessage({ action: 'updateRunStatus', status: status });
        },

        degiskenleriMetneEkle: (metin) => {
            if (typeof metin !== 'string') return metin;
            return metin.replace(/{{(.*?)}}/g, (eslesme, degiskenAdi) => {
                const anahtar = degiskenAdi.trim();
                return senaryoMotoru.degiskenler[anahtar] !== undefined ? senaryoMotoru.degiskenler[anahtar] : eslesme;
            });
        },
        
        blokBitimleriniBul: (adimListesi, baslangicIndeksi) => {
            let elseIndeksi = -1, bitisIndeksi = -1, seviye = 0;
            const baslangicTipi = adimListesi[baslangicIndeksi].tip;
            const arananBaslangic = baslangicTipi;
            const arananBitis = baslangicTipi === 'if_start' ? 'if_end' : 'loop_end';
            
            for (let i = baslangicIndeksi + 1; i < adimListesi.length; i++) {
                const mevcutTip = adimListesi[i].tip;
                if (mevcutTip === arananBaslangic) {
                    seviye++;
                } else if (baslangicTipi === 'if_start' && mevcutTip === 'else_block' && seviye === 0) {
                    elseIndeksi = i;
                } else if (mevcutTip === arananBitis) {
                    if (seviye === 0) {
                        bitisIndeksi = i;
                        break;
                    }
                    seviye--;
                }
            }
            return { elseIndeksi, bitisIndeksi };
        },

        adimlariIsle: async function(adimListesi, baslangicIndeksi = 0) {
            let i = baslangicIndeksi;
            while (i < adimListesi.length && this.calisiyor) {
                const veri = adimListesi[i];
                try {
                    let element = null;
                    if (veri.deger) {
                        const secici = this.degiskenleriMetneEkle(veri.deger);
                        try {
                            element = await this.waitForElement(secici);
                        } catch (e) {
                            throw new Error(`Seçici bulunamadı veya zaman aşımına uğradı: ${secici}. Hata: ${e.message}`);
                        }
                    }
                    switch (veri.tip) {
                        case 'tıkla':
                            if (!element) throw new Error(`Seçici bulunamadı: ${veri.deger}`);
                            element.click();
                            break;
                        case 'yaz':
                            if (!element) throw new Error(`Seçici bulunamadı: ${veri.deger}`);
                            element.value = this.degiskenleriMetneEkle(veri.metin);
                            element.dispatchEvent(new Event('input', { bubbles: true }));
                            break;
                        case 'kopyala':
                            if (!element) throw new Error(`Seçici bulunamadı: ${veri.deger}`);
                            const deger = element.value !== undefined ? element.value : element.textContent;
                            if (veri.degisken) {
                                this.degiskenler[veri.degisken] = deger.trim();
                            }
                            // Not: Güvenlik kısıtlamaları nedeniyle content script'ten clipboard'a yazmak zordur.
                            // Bu kısım gelecekte manifest'e "clipboardWrite" izni eklenerek geliştirilebilir.
                            break;
                        case 'wait':
                            await this.bekle(parseInt(veri.ms, 10));
                            break;
                        case 'screenshot':
                            // Bu eylem background script tarafından yönetilmelidir.
                            // Şimdilik atlanıyor.
                            break;
                        case 'scroll':
                            window.scrollTo(0, document.body.scrollHeight);
                            break;
                        case 'if_start':
                            const { elseIndeksi, bitisIndeksi } = this.blokBitimleriniBul(adimListesi, i);
                            if (bitisIndeksi === -1) throw new Error("Eşleşen 'EĞER BİTTİ' bloğu bulunamadı.");
                            
                            if (element) { // Koşul doğruysa
                                await this.adimlariIsle(adimListesi.slice(i + 1, elseIndeksi !== -1 ? elseIndeksi : bitisIndeksi));
                            } else if (elseIndeksi !== -1) { // Koşul yanlışsa ve DEĞİLSE varsa
                                await this.adimlariIsle(adimListesi.slice(elseIndeksi + 1, bitisIndeksi));
                            }
                            i = bitisIndeksi;
                            continue;
                        case 'loop_start':
                            const donguBitis = this.blokBitimleriniBul(adimListesi, i).bitisIndeksi;
                            if (donguBitis === -1) throw new Error("Eşleşen 'DÖNGÜ BİTTİ' bloğu bulunamadı.");
                            const tekrarSayisi = parseInt(this.degiskenleriMetneEkle(veri.sayi), 10) || 0;
                            for (let j = 0; j < tekrarSayisi; j++) {
                                this.degiskenler['dongu_indeksi'] = j + 1;
                                await this.adimlariIsle(adimListesi.slice(i + 1, donguBitis));
                            }
                            i = donguBitis;
                            continue;
                        case 'comment':
                        case 'else_block':
                        case 'if_end':
                        case 'loop_end':
                            // Bu adımlar sadece mantıksal ayraçlardır, eylem gerçekleştirmezler.
                            break;
                    }
                    await this.bekle(300); // Adımlar arası küçük bir bekleme
                    i++;
                } catch (hata) {
                    this.durumuGuncelle({ type: 'hata', messageKey: 'hataGenel', params: { adim: i + 1, mesaj: hata.message } });
                    this.calisiyor = false;
                    return;
                }
            }
        },

        calistir: async (adimlar) => {
            if (this.calisiyor) return;
            this.calisiyor = true;
            this.degiskenler = {};
            this.durumuGuncelle({ type: 'calisiyor', messageKey: 'durumCalisiyor' });
            
            await this.adimlariIsle(adimlar);

            if (this.calisiyor) { // Eğer bir hata ile durmadıysa
                this.durumuGuncelle({ type: 'basari', messageKey: 'durumBasarili' });
            }
            this.calisiyor = false;
        }
    };

    // --- ARKA PLAN SCRIPT'İNDEN GELEN MESAJLARI DİNLE ---
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'startSelection') {
            secimModu.baslat();
            sendResponse({ success: true });
        } else if (request.action === 'executeScenario') {
            senaryoMotoru.calistir(request.steps);
            sendResponse({ success: true });
        } else if (request.action === 'selectElementByNumber') {
            try {
                const elementNumber = request.elementNumber;
                if (elementNumber > 0 && elementNumber <= sisypiMarkers.length) {
                    const targetElement = sisypiMarkers[elementNumber - 1].targetElement;
                    const secici = secimModu.cssSeciciOlustur(targetElement);
                    const elementData = {
                        selector: secici,
                        tagName: targetElement.tagName,
                        id: targetElement.id || null,
                        name: targetElement.name || null,
                        value: targetElement.value !== undefined ? targetElement.value : null,
                        textContent: targetElement.textContent ? targetElement.textContent.trim() : null,
                        placeholder: targetElement.placeholder || null
                    };
                    chrome.runtime.sendMessage({ action: 'elementSelectedFromContent', elementData: elementData });
                    sendResponse({ success: true }); // background.js'e onay gönder
                } else {
                    sendResponse({ success: false, error: 'Geçersiz element numarası.' });
                }
            } catch (e) {
                console.error("Content Script: Error in selectElementByNumber:", e);
                sendResponse({ success: false, error: `Element seçimi sırasında hata oluştu: ${e.message}` });
                secimModu.durdur(); // Hata durumunda da modu durdur
            }
        } else if (request.action === 'stopSelection') {
            secimModu.durdur();
        }
    });

})();
