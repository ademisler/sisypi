// --- EKLENTİNİN BEYNİ: ARKA PLAN SERVİSİ (SERVICE WORKER) ---
// Tüm veri yönetimi ve iş mantığı burada merkezileştirilmiştir.

/**
 * Uygulamanın varsayılan durumunu ve verilerini yönetir.
 */
const getInitialAppState = async () => {
    const data = await chrome.storage.local.get('sisypi_appState');
    return data.sisypi_appState || { currentView: 'main', activeScenarioId: null };
};

// Eklenti ilk kurulduğunda veya güncellendiğinde çalışır.
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        // Depolamayı kontrol et, eğer boşsa varsayılanları ekle.
        const data = await chrome.storage.local.get(['sisypi_scenarios', 'sisypi_lang', 'sisypi_appState']);
        if (!data.sisypi_scenarios) {
            const defaultScenarios = {
                'ornek-1': { id: 'ornek-1', baslik: "Veri Kopyalama Örneği", urlKisitlamasi: "", adimlar: [{ tip: 'comment', metin: 'Sayfadaki bir başlığı değişkene ata ve kullan.' }, { tip: 'kopyala', deger: 'h1', degisken: 'sayfaBasligi' }, { tip: 'wait', ms: '500' }, { tip: 'comment', metin: 'Bu adım normalde bir inputa yazardı, ama şimdilik bir alert gösteriyor: {{sayfaBasligi}}' }] },
                'ornek-2': { id: 'ornek-2', baslik: "Koşullu İşlem (EĞER/DEĞİLSE)", urlKisitlamasi: "", adimlar: [{ tip: 'comment', metin: 'Sayfada olmayan bir elementi kontrol et.' }, { tip: 'if_start', deger: '#yok-boyle-bir-element' }, { tip: 'comment', metin: 'Bu adım çalışmamalı (EĞER bloğu).' }, { tip: 'else_block' }, { tip: 'comment', metin: 'Bu adım çalışmalı (DEĞİLSE bloğu).' }, { tip: 'if_end' }] },
                'ornek-3': { id: 'ornek-3', baslik: "Döngü ve Hata Yakalama", urlKisitlamasi: "", adimlar: [{ tip: 'comment', metin: 'Bu döngü, var olmayan butonlara tıklamaya çalışacak ve hata verecektir.' }, { tip: 'loop_start', sayi: '4' }, { tip: 'tıkla', deger: 'button#yok-boyle-bir-buton-{{dongu_indeksi}}' }, { tip: 'wait', ms: '200' }, { tip: 'loop_end' }] }
            };
            await chrome.storage.local.set({ sisypi_scenarios: defaultScenarios });
        }
        if (!data.sisypi_lang) {
            await chrome.storage.local.set({ sisypi_lang: 'tr' });
        }
        if(!data.sisypi_appState) {
            await chrome.storage.local.set({ sisypi_appState: { currentView: 'main', activeScenarioId: null } });
        }
    }
});

// Popup veya Content Script'lerden gelen mesajları dinler.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Mesajları asenkron olarak işlemek için 'true' döndürmek önemlidir.
    const actionHandlers = {
        getInitialData: async () => {
            const scenariosData = await chrome.storage.local.get('sisypi_scenarios');
            const langData = await chrome.storage.local.get('sisypi_lang');
            const appState = await getInitialAppState();
            console.log("Background: Sending initial appState to popup:", appState);
            sendResponse({
                scenarios: scenariosData.sisypi_scenarios || {},
                language: langData.sisypi_lang || 'tr',
                appState: appState
            });
        },
        saveScenarios: async () => {
            await chrome.storage.local.set({ sisypi_scenarios: request.data });
            sendResponse({ success: true });
        },
        saveLanguage: async () => {
            await chrome.storage.local.set({ sisypi_lang: request.data });
            sendResponse({ success: true });
        },
        updateAppState: async () => {
            const currentState = await getInitialAppState();
            const newState = { ...currentState, ...request.data };
            await chrome.storage.local.set({ sisypi_appState: newState });
            sendResponse({ success: true });
        },
        runScenario: async () => {
            const scenarios = request.allScenarios || (await chrome.storage.local.get('sisypi_scenarios')).sisypi_scenarios;
            const scenario = scenarios[request.scenarioId];
            if (!scenario) {
                sendResponse({ success: false, error: 'Scenario not found' });
                return;
            }

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (scenario.urlKisitlamasi && !tab.url.includes(scenario.urlKisitlamasi)) {
                chrome.runtime.sendMessage({
                    action: 'updateRunStatus',
                    status: {
                        type: 'hata',
                        messageKey: 'hataUrlUyusmuyor',
                        params: { kisitlama: scenario.urlKisitlamasi }
                    }
                });
                sendResponse({ success: false, error: 'URL mismatch' });
                return;
            }
            
            await injectContentScript(tab.id);
            chrome.tabs.sendMessage(tab.id, {
                action: 'executeScenario',
                steps: scenario.adimlar
            }, (response) => {
                 if (chrome.runtime.lastError) {
                    console.error("Background: Error sending executeScenario message:", chrome.runtime.lastError.message);
                    chrome.runtime.sendMessage({
                        action: 'updateRunStatus',
                        status: {
                            type: 'hata',
                            messageKey: 'hataGenel',
                            params: { adim: 'Senaryo Çalıştırma', mesaj: chrome.runtime.lastError.message }
                        }
                    });
                 }
            });
            sendResponse({ success: true });
        },
        startSelection: async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.id) {
                chrome.runtime.sendMessage({
                    action: 'updateRunStatus',
                    status: {
                        type: 'hata',
                        messageKey: 'hataGenel',
                        params: { adim: 'Seçim Modu', mesaj: 'İçerik betiği bu sayfaya enjekte edilemiyor. Lütfen normal bir web sayfasında deneyin.' }
                    }
                });
                sendResponse({ success: false, error: 'Cannot inject content script on this page.' });
                return;
            }
            await injectContentScript(tab.id);
            chrome.tabs.sendMessage(tab.id, { action: 'startSelection' }, (response) => {
                 if (chrome.runtime.lastError) {
                    console.error("Background: Error sending startSelection message:", chrome.runtime.lastError.message);
                    chrome.runtime.sendMessage({
                        action: 'updateRunStatus',
                        status: {
                            type: 'hata',
                            messageKey: 'hataGenel',
                            params: { adim: 'Seçim Modu Başlatma', mesaj: chrome.runtime.lastError.message }
                        }
                    });
                 } else {
                    activeSelectionTabId = tab.id; // Seçim modunun başladığı sekme ID'sini kaydet
                    console.log("Background: activeSelectionTabId set to", activeSelectionTabId);
                 }
            });
        },
        selectElementByNumber: async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.id) {
                sendResponse({ success: false, error: 'No active tab.' });
                return;
            }
            try {
                chrome.tabs.sendMessage(
                    tab.id,
                    { action: 'selectElementByNumber', elementNumber: request.elementNumber },
                    () => {
                        if (chrome.runtime.lastError) {
                            sendResponse({ success: false, error: chrome.runtime.lastError.message });
                        } else {
                            sendResponse({ success: true });
                        }
                    }
                );
            } catch (e) {
                console.error(`Background: Failed to send selectElementByNumber message to content script: ${e.message}`);
                sendResponse({ success: false, error: e.message });
            }
            return true;
        },
        elementSelectedFromContent: async () => {
            // content.js'ten gelen element verisini popup'a ilet
            chrome.runtime.sendMessage({ action: 'elementSelected', elementData: request.elementData });
        },
        stopSelection: async () => {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.id) {
                sendResponse({ success: false, error: 'No active tab.' });
                return;
            }
            chrome.tabs.sendMessage(tab.id, { action: 'stopSelection' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Background: Error sending stopSelection message:", chrome.runtime.lastError.message);
                    chrome.runtime.sendMessage({
                        action: 'updateRunStatus',
                        status: {
                            type: 'hata',
                            messageKey: 'hataGenel',
                            params: { adim: 'Seçim Modu Durdurma', mesaj: chrome.runtime.lastError.message }
                        }
                    });
                } else {
                    activeSelectionTabId = null; // Seçim modunun durduğu sekme ID'sini temizle
                    console.log("Background: activeSelectionTabId cleared (stopSelection).");
                }
            });
        },
        updateRunStatus: () => {
            // Content script'ten gelen durumu popup'a iletiyoruz.
            chrome.runtime.sendMessage({ action: 'updateRunStatus', status: request.status });
        },
        backupAll: async () => {
            const { sisypi_scenarios } = await chrome.storage.local.get('sisypi_scenarios');
            const dataStr = JSON.stringify(sisypi_scenarios || {}, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            chrome.downloads.download({
                url: url,
                filename: `sisypi_yedek_${new Date().toISOString().slice(0, 10)}.json`,
                saveAs: true
            }, () => {
                URL.revokeObjectURL(url); // Bellek sızıntısını önle
            });
        },
        restoreFromBackup: async () => {
            await chrome.storage.local.set({ sisypi_scenarios: request.data });
            sendResponse({ success: true, scenarios: request.data });
        }
    };
    
    const handler = actionHandlers[request.action];
    if (handler) {
        handler();
        return true; // Asenkron yanıt için
    }
});


// Helper function to inject content script if not already present
async function injectContentScript(tabId) {
    try {
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => window.sisypiContentScriptInjected,
        });
        if (result) return; // Zaten enjekte edilmiş

        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['scripts/content.js'],
        });
    } catch (e) {
        // console.error(`Failed to inject script: ${e}`);
        // Farklı origin'deki sayfalara (chrome://, file://) enjekte edilemez.
    }
}

// Sekme değiştiğinde veya güncellendiğinde seçim modunu durdur
let activeSelectionTabId = null;

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    if (activeSelectionTabId && activeSelectionTabId !== activeInfo.tabId) {
        // Eski sekmede seçim modunu durdur
        try {
            await chrome.tabs.sendMessage(activeSelectionTabId, { action: 'stopSelection' });
        } catch (e) {
            // Sekme kapanmış veya içerik betiği artık aktif değilse hata oluşabilir.
            console.warn("Background: Error stopping selection on old tab:", e.message);
        }
        activeSelectionTabId = null;
        console.log("Background: activeSelectionTabId cleared (onActivated).");
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (activeSelectionTabId === tabId && changeInfo.status === 'loading') {
        // Sekme yeniden yükleniyor veya yeni bir sayfaya gidiyor, seçim modunu durdur
        try {
            await chrome.tabs.sendMessage(tabId, { action: 'stopSelection' });
        } catch (e) {
            console.warn("Background: Error stopping selection on updated tab:", e.message);
        }
        activeSelectionTabId = null;
    }
});
