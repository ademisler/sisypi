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