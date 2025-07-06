// sisypi-extension/content.js

let isSelectorActive = false;
let highlightOverlay = null;
let executionHighlight = null; // For highlighting during scenario execution

// Helper to create and manage execution highlight
function createExecutionHighlight(element) {
    if (executionHighlight) {
        executionHighlight.remove();
    }
    executionHighlight = document.createElement('div');
    executionHighlight.style.position = 'absolute';
    executionHighlight.style.border = '3px solid #9ece6a'; // Success color
    executionHighlight.style.borderRadius = '4px';
    executionHighlight.style.zIndex = '9999998';
    executionHighlight.style.pointerEvents = 'none';
    executionHighlight.style.transition = 'all 0.2s ease-out';
    document.body.appendChild(executionHighlight);
    updateExecutionHighlight(element);
}

function updateExecutionHighlight(element) {
    if (executionHighlight && element) {
        const rect = element.getBoundingClientRect();
        executionHighlight.style.width = `${rect.width}px`;
        executionHighlight.style.height = `${rect.height}px`;
        executionHighlight.style.top = `${rect.top + window.scrollY}px`;
        executionHighlight.style.left = `${rect.left + window.scrollX}px`;
    }
}

function removeExecutionHighlight() {
    if (executionHighlight) {
        executionHighlight.remove();
        executionHighlight = null;
    }
}

// Arka plan betiğinden gelen mesajları dinle
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'activateSelector') {
        if (!isSelectorActive) {
            activateSelector();
        }
    } else if (request.action === 'performClick') {
        let element;
        try {
            element = document.querySelector(request.selector);
        } catch (e) {
            sendResponse({ success: false, error: 'Invalid selector' });
            return true;
        }
        if (element) {
            createExecutionHighlight(element);
            element.click();
            removeExecutionHighlight();
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'Element not found' });
        }
    } else if (request.action === 'performTypeText') {
        let element;
        try {
            element = document.querySelector(request.selector);
        } catch (e) {
            sendResponse({ success: false, error: 'Invalid selector' });
            return true;
        }
        if (element) {
            createExecutionHighlight(element);
            element.value = request.value;
            element.dispatchEvent(new Event('input', { bubbles: true })); // Trigger input event
            element.dispatchEvent(new Event('change', { bubbles: true })); // Trigger change event
            removeExecutionHighlight();
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'Element not found' });
        }
    } else if (request.action === 'performCopyText') {
        let element;
        try {
            element = document.querySelector(request.selector);
        } catch (e) {
            sendResponse({ success: false, error: 'Invalid selector' });
            return true;
        }
        if (element && element.innerText) {
            createExecutionHighlight(element);
            await navigator.clipboard.writeText(element.innerText);
            removeExecutionHighlight();
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'Element not found or no text to copy' });
        }
    } else if (request.action === 'performScroll') {
        if (request.value === 'bottom') {
            window.scrollTo(0, document.body.scrollHeight);
        } else if (request.value.startsWith('#') || request.value.startsWith('.')) {
            let element;
            try {
                element = document.querySelector(request.value);
            } catch (e) {
                sendResponse({ success: false, error: 'Invalid selector' });
                return true;
            }
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        sendResponse({ success: true });
    } else if (request.action === 'performWaitForElement') {
        const maxAttempts = 20; // Try for up to 10 seconds (20 * 500ms)
        let attempts = 0;
        const interval = setInterval(() => {
            let element;
            try {
                element = document.querySelector(request.selector);
            } catch (e) {
                clearInterval(interval);
                sendResponse({ success: false, error: 'Invalid selector' });
                return;
            }
            if (element) {
                clearInterval(interval);
                createExecutionHighlight(element);
                setTimeout(removeExecutionHighlight, 1000); // Highlight for 1 second
                sendResponse({ success: true });
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                sendResponse({ success: false, error: 'Element not found after waiting' });
            }
            attempts++;
        }, 500);
        return true; // Indicate async response
    } else if (request.action === 'checkElementExists') {
        let element;
        try {
            element = document.querySelector(request.selector);
        } catch (e) {
            sendResponse({ success: false, error: 'Invalid selector' });
            return true;
        }
        sendResponse({ success: true, found: !!element });
        return true;
    } else if (request.action === 'scenarioError') {
        alert('Senaryo hatası: ' + request.message);
        sendResponse({});
        return true;
    }
});

function activateSelector() {
    isSelectorActive = true;
    console.log('Sisypi: Element seçici aktif.');
    document.body.style.cursor = 'crosshair';

    // Vurgulama için bir div oluşturalım
    highlightOverlay = document.createElement('div');
    highlightOverlay.style.position = 'absolute';
    highlightOverlay.style.backgroundColor = 'rgba(167, 119, 227, 0.4)'; // Mor tema rengi
    highlightOverlay.style.border = '2px solid #a777e3';
    highlightOverlay.style.borderRadius = '4px';
    highlightOverlay.style.zIndex = '9999999';
    highlightOverlay.style.pointerEvents = 'none'; // Üzerindeki tıklamaları engelleme
    document.body.appendChild(highlightOverlay);

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleMouseClick, true); // `true` ile event'i yakalama aşamasında dinle
}

function deactivateSelector() {
    isSelectorActive = false;
    console.log('Sisypi: Element seçici devre dışı.');
    document.body.style.cursor = 'default';
    
    if (highlightOverlay) {
        highlightOverlay.remove();
        highlightOverlay = null;
    }

    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('mouseout', handleMouseOut);
    document.removeEventListener('click', handleMouseClick, true);
}

function handleMouseOver(e) {
    const target = e.target;
    if (!target || target === highlightOverlay) return;

    const rect = target.getBoundingClientRect();
    highlightOverlay.style.width = `${rect.width}px`;
    highlightOverlay.style.height = `${rect.height}px`;
    highlightOverlay.style.top = `${rect.top + window.scrollY}px`;
    highlightOverlay.style.left = `${rect.left + window.scrollX}px`;
}

function handleMouseOut(e) {
    highlightOverlay.style.width = '0px';
}

function handleMouseClick(e) {
    if (!isSelectorActive) return; // Guard clause

    // Immediately deactivate to prevent further clicks
    isSelectorActive = false; // Set flag to false first
    deactivateSelector(); // Then remove listeners and overlay

    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    const selector = getCssSelector(target);
    const innerText = target.innerText ? target.innerText.trim() : '';
    console.log('Element seçildi:', selector, 'Text:', innerText);

    chrome.runtime.sendMessage({
        action: 'elementSelected',
        data: {
            selector: selector,
            text: innerText
        }
    });
}

// Element için benzersiz bir CSS seçici oluşturan basit bir fonksiyon
function getCssSelector(el) {
    if (!(el instanceof Element)) return;
    let path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el.id) {
            selector += '#' + el.id;
            path.unshift(selector);
            break;
        } else {
            let sib = el, nth = 1;
            while (sib = sib.previousElementSibling) {
                if (sib.nodeName.toLowerCase() == selector)
                    nth++;
            }
            if (nth != 1)
                selector += ":nth-of-type("+nth+")";
        }
        path.unshift(selector);
        el = el.parentNode;
    }
    return path.join(" > ");
}
