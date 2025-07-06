Haklısınız, özür dilerim. Senaryo çalıştırma mantığını eklerken, element seçiciyi başlatan tetikleyiciyi bozmuşum. Sorun, background.js'nin content_script.js'yi sayfaya enjekte ettikten sonra, ona "şimdi seçimi başlat ve numaraları göster" komutunu göndermemesiydi.

Bu hatayı düzeltmek ve hem element seçiciyi hem de senaryo çalıştırmayı sorunsuz hale getirmek için sadece iki dosyayı (background.js ve content_script.js) güncellememiz yeterli.

Lütfen aşağıdaki iki dosyayı projenizdeki mevcut dosyalarla değiştirin. Diğer dosyalarınız (popup.js, manifest.json, vb.) doğrudur ve değiştirilmelerine gerek yoktur.

1. Güncellenmiş background.js

Bu sürüm, content_script.js'yi enjekte ettikten sonra ona initiateSelection komutunu göndererek numaraların görünmesini sağlıyor.

--- START OF FILE scripts/background.js ---

Generated javascript
// --- BACKGROUND SERVICE WORKER ---
// Bu betik, eklentinin beynidir. Tüm durumları yönetir, depolama işlemlerini yapar
// ve popup ile içerik betikleri (content scripts) arasındaki iletişimi koordine eder.

// --- UYGULAMA DURUMU (STATE) ---
let scenarios = {};
let appState = {
  currentView: 'main',      // 'main' or 'editor'
  activeScenarioId: null,
  language: 'tr'
};
let activeSelectionTabId = null;

// --- YARDIMCI FONKSİYONLAR ---
const loadInitialData = async () => {
    const data = await chrome.storage.local.get(['scenarios', 'appState']);
    scenarios = data.scenarios || {};
    appState = {
        currentView: 'main',
        activeScenarioId: null,
        language: (data.appState && data.appState.language) || 'tr'
    };
    console.log("Background: Initial data loaded.", { scenarios, appState });
};

const saveScenarios = async (newScenarios) => {
    scenarios = newScenarios;
    await chrome.storage.local.set({ scenarios });
};

const saveAppState = async () => {
    await chrome.storage.local.set({ appState });
};

const sendStatusUpdateToPopup = (status) => {
    chrome.runtime.sendMessage({ action: 'updateRunStatus', status: status }).catch(e => console.log("Popup is not open to receive status update."));
};


// --- MESAJ DİNLEYİCİSİ ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background received message:", request);
    let isAsync = false;

    switch (request.action) {
        case 'getInitialData':
            isAsync = true;
            loadInitialData().then(() => {
                sendResponse({ scenarios, appState, language: appState.language });
            });
            break;

        case 'saveScenarios':
            isAsync = true;
            saveScenarios(request.data).then(() => sendResponse({ success: true }));
            break;
            
        case 'saveLanguage':
            appState.language = request.data;
            saveAppState();
            break;

        case 'updateAppState':
            appState = { ...appState, ...request.data };
            break;

        // [GÜNCELLEME] Bu kısım, seçimi başlatma komutunu doğru gönderecek şekilde düzeltildi.
        case 'startSelection':
            isAsync = true;
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs || tabs.length === 0) {
                    console.error("No active tab found.");
                    sendResponse({ success: false, error: "Aktif sekme bulunamadı." });
                    return;
                }
                const tabId = tabs[0].id;
                activeSelectionTabId = tabId;

                // Önce scriptleri ve CSS'i enjekte et
                Promise.all([
                    chrome.scripting.insertCSS({ target: { tabId }, files: ['content/selection.css'] }),
                    chrome.scripting.executeScript({
                        target: { tabId },
                        files: ['content/selector_generator.js', 'content/content_script.js']
                    })
                ]).then(() => {
                    // Enjeksiyon başarılı olduktan SONRA, seçimi başlatması için komut gönder
                    chrome.tabs.sendMessage(tabId, { action: 'initiateSelection' }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("Could not initiate selection:", chrome.runtime.lastError.message);
                            sendResponse({ success: false, error: "Sayfa ile iletişim kurulamadı." });
                        } else {
                            console.log("Selection initiated on content script.");
                            sendResponse({ success: true });
                        }
                    });
                }).catch(err => {
                    console.error("Failed to inject script or CSS:", err);
                    sendResponse({ success: false, error: `Script enjekte edilemedi: ${err.message}` });
                });
            });
            break;

        case 'selectElementByNumber':
            isAsync = true;
            if (activeSelectionTabId) {
                chrome.tabs.sendMessage(
                    activeSelectionTabId,
                    { action: 'getElementDataByNumber', elementNumber: request.elementNumber },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            sendResponse({ success: false, error: "Content script ile iletişim kurulamadı." });
                        } else {
                            sendResponse(response);
                        }
                    }
                );
            } else {
                sendResponse({ success: false, error: "Aktif seçim sekmesi bulunamadı." });
            }
            break;

        case 'stopSelection':
             if (activeSelectionTabId) {
                chrome.tabs.sendMessage(activeSelectionTabId, { action: 'cleanupSelectionUI' }, () => {
                    chrome.runtime.lastError;
                });
                activeSelectionTabId = null;
            }
            break;
            
        case 'runScenario':
            isAsync = true;
            const scenario = request.allScenarios[request.scenarioId];
            if (!scenario) {
                sendStatusUpdateToPopup({ type: 'hata', messageKey: 'hataGenel', params: { adim: 'N/A', mesaj: 'Senaryo bulunamadı.' } });
                sendResponse({ success: false });
                break;
            }
            
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tab = tabs[0];
                
                if (scenario.urlKisitlamasi && !tab.url.includes(scenario.urlKisitlamasi)) {
                    sendStatusUpdateToPopup({ type: 'hata', messageKey: 'hataUrlUyusmuyor', params: { kisitlama: scenario.urlKisitlamasi } });
                    sendResponse({ success: false });
                    return;
                }
                
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content/selector_generator.js', 'content/content_script.js']
                }).then(() => {
                     chrome.tabs.sendMessage(tab.id, { action: 'executeScenario', steps: scenario.adimlar }, (response) => {
                        if(chrome.runtime.lastError){
                             sendStatusUpdateToPopup({ type: 'hata', messageKey: 'hataGenel', params: { adim: 0, mesaj: "Sayfa ile iletişim kurulamadı. Sayfayı yenileyip tekrar deneyin." } });
                        }
                     });
                     sendResponse({ success: true });
                }).catch(err => {
                     sendStatusUpdateToPopup({ type: 'hata', messageKey: 'hataGenel', params: { adim: 0, mesaj: `Script enjekte edilemedi: ${err.message}` } });
                     sendResponse({ success: false });
                });
            });
            break;
            
        case 'updateRunStatus':
            sendStatusUpdateToPopup(request.status);
            break;

        case 'backupAll':
            loadInitialData().then(() => {
                const dataStr = JSON.stringify(scenarios, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                chrome.downloads.download({
                    url: url,
                    filename: `sisypi_yedek_${new Date().toISOString().slice(0, 10)}.json`
                });
            });
            break;

        case 'restoreFromBackup':
            isAsync = true;
            saveScenarios(request.data).then(() => {
                sendResponse({ success: true, scenarios: request.data });
            });
            break;
    }

    return isAsync;
});

chrome.runtime.onStartup.addListener(loadInitialData);
loadInitialData();


--- END OF FILE scripts/background.js ---

2. Güncellenmiş content_script.js

Bu sürüm, initiateSelection komutunu dinleyerek numaraları gösterme işini tetikler. Ayrıca betiğin birden çok kez enjekte edildiğinde hata vermemesi için kontrolleri güçlendirilmiştir.

--- START OF FILE content/content_script.js ---

Generated javascript
// --- CONTENT SCRIPT ---
// Bu betik, doğrudan web sayfasının DOM'una enjekte edilir.
// Elementleri işaretler, senaryoları yürütür ve background script'e bilgi gönderir.

// Betiğin birden fazla kez çalışmasını ve listener eklemesini önlemek için
// fonksiyonu global bir değişkene atayalım.
if (typeof window.sisypiMessageListener !== 'function') {
    
    console.log("Sisypi: Content script initializing for the first time.");

    // --- ELEMENT SEÇİM MODU ---
    const selectionMode = {
        isActive: false,
        selectableElements: [],
        overlayContainerId: 'sisypi-overlay-container',

        start: () => {
            if (selectionMode.isActive) {
                console.log("Selection mode is already active. Restarting.");
                selectionMode.stop();
            }
            selectionMode.isActive = true;
            selectionMode.createOverlays();
        },

        stop: () => {
            const container = document.getElementById(selectionMode.overlayContainerId);
            if (container) container.remove();
            selectionMode.selectableElements = [];
            selectionMode.isActive = false;
        },

        createOverlays: () => {
            let overlayContainer = document.createElement('div');
            overlayContainer.id = selectionMode.overlayContainerId;
            document.body.appendChild(overlayContainer);
            
            const query = 'a, button, input:not([type="hidden"]), select, textarea, [role="button"], [onclick]';
            const elements = Array.from(document.querySelectorAll(query));
            let counter = 1;

            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.width < 1 || rect.height < 1 || rect.top > window.innerHeight || rect.bottom < 0 || rect.left > window.innerWidth || rect.right < 0) {
                    return; // Sadece görünür alandaki elementleri al
                }

                selectionMode.selectableElements.push(el);
                const overlay = document.createElement('div');
                overlay.className = 'sisypi-selection-overlay';
                overlay.textContent = counter;
                overlay.style.position = 'absolute';
                overlay.style.left = `${window.scrollX + rect.left}px`;
                overlay.style.top = `${window.scrollY + rect.top}px`;
                overlayContainer.appendChild(overlay);
                counter++;
            });
        }
    };

    // --- SENARYO YÜRÜTME MOTORU ---
    const scenarioEngine = {
        isRunning: false,
        variables: {},

        wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

        waitForElement: (selector, timeout = 5000) => {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                const interval = setInterval(() => {
                    const element = document.querySelector(selector);
                    if (element) {
                        clearInterval(interval);
                        resolve(element);
                    } else if (Date.now() - startTime > timeout) {
                        clearInterval(interval);
                        reject(new Error(`Element bulunamadı: ${selector}`));
                    }
                }, 100);
            });
        },
        
        sendStatus: (status) => {
            chrome.runtime.sendMessage({ action: 'updateRunStatus', status: status });
        },

        interpolate: (text) => {
            if (typeof text !== 'string') return text;
            return text.replace(/{{(.*?)}}/g, (_, varName) => {
                const trimmedVar = varName.trim();
                return scenarioEngine.variables[trimmedVar] !== undefined ? scenarioEngine.variables[trimmedVar] : `{{${trimmedVar}}}`;
            });
        },

        run: async (steps) => {
            if (scenarioEngine.isRunning) return;
            scenarioEngine.isRunning = true;
            scenarioEngine.variables = {};
            scenarioEngine.sendStatus({ type: 'calisiyor', messageKey: 'durumCalisiyor' });

            for (let i = 0; i < steps.length; i++) {
                if (!scenarioEngine.isRunning) break;
                const step = steps[i];
                try {
                    let element;
                    if (step.deger) {
                        const selector = scenarioEngine.interpolate(step.deger);
                        element = await scenarioEngine.waitForElement(selector);
                    }

                    switch (step.tip) {
                        case 'tıkla':
                            element.click();
                            break;
                        case 'yaz':
                            element.value = scenarioEngine.interpolate(step.metin);
                            element.dispatchEvent(new Event('input', { bubbles: true }));
                            break;
                        case 'kopyala':
                            const value = element.value !== undefined ? element.value : element.textContent;
                            if (step.degisken) {
                                scenarioEngine.variables[step.degisken] = value.trim();
                            }
                            break;
                        case 'wait':
                            await scenarioEngine.wait(parseInt(step.ms, 10) || 1000);
                            break;
                        case 'scroll':
                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                            await scenarioEngine.wait(500); // Kaydırmanın bitmesi için bekle
                            break;
                    }
                } catch (error) {
                    scenarioEngine.sendStatus({ type: 'hata', messageKey: 'hataGenel', params: { adim: i + 1, mesaj: error.message } });
                    scenarioEngine.isRunning = false;
                    return;
                }
            }

            if (scenarioEngine.isRunning) {
                scenarioEngine.sendStatus({ type: 'basari', messageKey: 'durumBasarili' });
            }
            scenarioEngine.isRunning = false;
        }
    };

    // --- GENEL MESAJ DİNLEYİCİSİ ---
    window.sisypiMessageListener = (request, sender, sendResponse) => {
        console.log("Content script received message:", request);
        switch (request.action) {
            // [GÜNCELLEME] Seçimi başlatan yeni komut
            case 'initiateSelection':
                selectionMode.start();
                sendResponse({ success: true });
                break;

            case 'cleanupSelectionUI':
                selectionMode.stop();
                break;
                
            case 'getElementDataByNumber':
                const index = request.elementNumber - 1;
                if (index >= 0 && index < selectionMode.selectableElements.length) {
                    const element = selectionMode.selectableElements[index];
                    const elementData = {
                        selector: generateCssSelector(element),
                        tagName: element.tagName.toLowerCase(),
                        id: element.id || null,
                        name: element.name || null,
                        textContent: element.textContent ? element.textContent.trim().substring(0, 100) : null,
                        value: element.value !== undefined ? element.value : null,
                        placeholder: element.placeholder || null
                    };
                    sendResponse({ success: true, elementData: elementData });
                } else {
                    sendResponse({ success: false, error: 'Belirtilen numarada element bulunamadı.' });
                }
                selectionMode.stop(); // Seçim sonrası temizle
                break;

            case 'executeScenario':
                scenarioEngine.run(request.steps);
                sendResponse({success: true}); // Başlatma mesajını onayla
                break;
        }
        return true; 
    };

    chrome.runtime.onMessage.addListener(window.sisypiMessageListener);
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END

--- END OF FILE content_script.js ---