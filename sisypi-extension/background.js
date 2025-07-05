// sisypi-extension/background.js

// Bu değişken, hangi sekmenin element seçimi yaptığını takip eder.
let selectionTabId = null;

// Function to execute a single step
async function executeStep(tabId, step) {
    console.log('Executing step:', step);
    switch (step.action) {
        case 'Tıkla':
            await chrome.tabs.sendMessage(tabId, { action: 'performClick', selector: step.selector });
            break;
        case 'Değer Yaz':
            await chrome.tabs.sendMessage(tabId, { action: 'performTypeText', selector: step.selector, value: step.value });
            break;
        case 'Metni Kopyala':
            await chrome.tabs.sendMessage(tabId, { action: 'performCopyText', selector: step.selector });
            break;
        case 'Bekle':
            // Wait action handled in background script
            await new Promise(resolve => setTimeout(resolve, parseFloat(step.value) * 1000));
            break;
        case 'Sayfayı Kaydır':
            await chrome.tabs.sendMessage(tabId, { action: 'performScroll', value: step.value });
            break;
        case 'Elementi Bekle':
            await chrome.tabs.sendMessage(tabId, { action: 'performWaitForElement', selector: step.selector });
            break;
        case 'Koşullu Adım':
            // Conditional steps will need more complex logic, possibly recursive execution
            // For now, just log or skip
            console.log('Conditional step encountered, not yet fully implemented for execution:', step);
            break;
        default:
            console.warn('Unknown action type:', step.action);
    }
}

// Farklı dosyalardan (popup, content script) gelen mesajları dinler.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. Popup'tan "element seçme modunu başlat" mesajı geldi.
    if (request.action === 'startElementSelection') {
        // Mesajı gönderen popup'ın bulunduğu sekmenin ID'sini alıyoruz.
        selectionTabId = request.tabId;

        // 2. Aktif sekmeye (content.js) "seçiciyi aktive et" mesajı gönderiyoruz.
        chrome.tabs.sendMessage(selectionTabId, { action: 'activateSelector' });
        
        // Asenkron bir yanıt olacağını belirtmek için true döndür.
        return true; 
    }

    // 3. Content script'ten "element seçildi" mesajı geldi.
    if (request.action === 'elementSelected') {
        const { selector, text } = request.data;
        
        // Element seçimi bitti, tab ID'sini temizle.
        selectionTabId = null;

        // 4. Yeni adımı mevcut senaryoya eklemek için storage'ı kullan.
        chrome.storage.local.get('currentScenario', (data) => {
            let scenario = data.currentScenario || createNewScenario();
            
            scenario.steps.push({
                id: `step-${Date.now()}`,
                type: 'normal',
                action: 'Tıkla', // Default action for element selection
                selector: selector,
                value: selector, // For 'Tıkla', value is the selector
                name: text ? `Element: ${text.substring(0, 30)}...` : `Element: ${selector.substring(0, 30)}...`
            });

            // Güncellenmiş senaryoyu storage'a kaydet.
            chrome.storage.local.set({ currentScenario: scenario }, () => {
                console.log('Yeni adım senaryoya eklendi ve kaydedildi:', scenario);
            });
        });
        
        return true;
    } else if (request.action === 'runScenario') {
        const { scenario, tabId } = request;
        console.log('Running scenario:', scenario, 'on tab:', tabId);

        // Execute steps sequentially
        (async () => {
            for (const step of scenario.steps) {
                try {
                    await executeStep(tabId, step);
                } catch (error) {
                    console.error('Scenario execution failed at step:', step, error);
                    // Optionally send error back to popup
                    break; // Stop execution on first error
                }
            }
            console.log('Scenario execution finished.');
        })();
        return true; // Indicate async response
    }
});

function createNewScenario() {
    return {
        id: `scenario-${Date.now()}`,
        title: 'Yeni Senaryo',
        steps: []
    };
}