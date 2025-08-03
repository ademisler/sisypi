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

    try {
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
            
        default:
            console.warn(`Unknown action: ${request.action}`);
            sendResponse({ success: false, error: `Unknown action: ${request.action}` });
            break;
        }
    } catch (error) {
        console.error(`Error handling ${request.action}:`, error);
        sendResponse({ success: false, error: error.message });
    }

    return isAsync;
});

chrome.runtime.onStartup.addListener(loadInitialData);
loadInitialData();