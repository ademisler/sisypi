// --- SAYFA İÇERİĞİYLE ETKİLEŞEN BETİK (CONTENT SCRIPT) ---
// Bu betik, background.js tarafından gerektiğinde web sayfasına enjekte edilir.

(() => {
    // Betiğin birden çok kez enjekte edilmesini önlemek için kontrol
    if (window.sisypiContentScriptInjected) {
        return;
    }
    window.sisypiContentScriptInjected = true;

    let sonVurgulananElement = null;

    // --- ELEMENT SEÇİM MODU ---
    const secimModu = {
        baslat: () => {
            document.body.classList.add('sisypi-secim-modu-aktif');
            document.addEventListener('mouseover', secimModu.elementiVurgula);
            document.addEventListener('mouseout', secimModu.vurgulamayiKaldir);
            document.addEventListener('click', secimModu.elementiSec, { capture: true });
            
            // Stilleri sayfaya ekle
            if (!document.getElementById('sisypi-styles')) {
                const style = document.createElement('style');
                style.id = 'sisypi-styles';
                style.textContent = `
                    body.sisypi-secim-modu-aktif, body.sisypi-secim-modu-aktif * { cursor: crosshair !important; }
                    .sisypi-secim-icin-vurgula { outline: 3px solid #db2777 !important; outline-offset: 3px; background-color: rgba(219, 39, 119, 0.2) !important; box-shadow: 0 0 15px rgba(219, 39, 119, 0.5) !important; }
                `;
                document.head.appendChild(style);
            }
        },
        durdur: () => {
            document.body.classList.remove('sisypi-secim-modu-aktif');
            secimModu.vurgulamayiKaldir();
            document.removeEventListener('mouseover', secimModu.elementiVurgula);
            document.removeEventListener('mouseout', secimModu.vurgulamayiKaldir);
            document.removeEventListener('click', secimModu.elementiSec, { capture: true });
        },
        elementiVurgula: (e) => {
            const hedef = e.target;
            secimModu.vurgulamayiKaldir();
            hedef.classList.add('sisypi-secim-icin-vurgula');
            sonVurgulananElement = hedef;
        },
        vurgulamayiKaldir: () => {
            if (sonVurgulananElement) {
                sonVurgulananElement.classList.remove('sisypi-secim-icin-vurgula');
                sonVurgulananElement = null;
            }
        },
        elementiSec: (e) => {
            e.preventDefault();
            e.stopPropagation();
            const secici = secimModu.cssSeciciOlustur(e.target);
            secimModu.durdur();
            chrome.runtime.sendMessage({ action: 'elementSelected', selector: secici });
        },
        cssSeciciOlustur: (el) => {
            if (!(el instanceof Element)) return;
            if (el.id) return `#${el.id.trim()}`;
            const yol = [];
            while (el.parentElement) {
                let parca = el.tagName.toLowerCase();
                const kardesler = Array.from(el.parentElement.children).filter(e => e.tagName === el.tagName);
                if (kardesler.length > 1) {
                    const index = kardesler.indexOf(el) + 1;
                    parca += `:nth-of-type(${index})`;
                }
                yol.unshift(parca);
                el = el.parentElement;
            }
            return yol.join(' > ');
        }
    };

    // --- SENARYO YÜRÜTME MOTORU ---
    const senaryoMotoru = {
        degiskenler: {},
        calisiyor: false,

        bekle: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
        
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
                        element = document.querySelector(secici);
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
        }
    });

})();
