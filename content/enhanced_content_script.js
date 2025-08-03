// === ENHANCED CONTENT SCRIPT ===
// Professional automation engine with improved capabilities and error handling

(function() {
    'use strict';

    // Prevent multiple initializations
    if (window.sisypiEnhancedEngine) {
        console.log('Sisypi: Enhanced engine already initialized');
        return;
    }

    console.log('Sisypi: Initializing enhanced automation engine');

    // === CONSTANTS ===
    const CONSTANTS = {
        OVERLAY_CONTAINER_ID: 'sisypi-enhanced-overlay',
        HIGHLIGHT_CLASS: 'sisypi-element-highlight',
        DEFAULT_TIMEOUT: 10000,
        ELEMENT_WAIT_INTERVAL: 100,
        SCROLL_BEHAVIOR: 'smooth',
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,
    };

    // Enhanced selectable elements query
    const SELECTABLE_ELEMENTS_QUERY = [
        'a', 'button', 'input:not([type="hidden"])', 'select', 'textarea',
        '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]',
        '[onclick]', '[onmousedown]', '[onmouseup]', '[onkeydown]', '[onkeyup]',
        '.btn', '.button', '.clickable', '.link',
        '[data-testid]', '[data-cy]', '[data-test]',
        'img[alt]', 'span[onclick]', 'div[onclick]', 'li[onclick]',
        '[contenteditable="true"]', '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    // === UTILITY FUNCTIONS ===
    const utils = {
        // Generate unique selector for element
        generateSelector: (element) => {
            if (element.id) {
                return `#${element.id}`;
            }
            
            if (element.className && typeof element.className === 'string') {
                const classes = element.className.split(' ').filter(c => c && !c.startsWith('sisypi-'));
                if (classes.length > 0) {
                    const selector = `${element.tagName.toLowerCase()}.${classes.join('.')}`;
                    if (document.querySelectorAll(selector).length === 1) {
                        return selector;
                    }
                }
            }

            // Try with data attributes
            const dataAttrs = ['data-testid', 'data-cy', 'data-test', 'data-id'];
            for (const attr of dataAttrs) {
                const value = element.getAttribute(attr);
                if (value) {
                    return `[${attr}="${value}"]`;
                }
            }

            // Generate path-based selector
            const path = [];
            let current = element;
            
            while (current && current !== document.body) {
                let selector = current.tagName.toLowerCase();
                
                if (current.id) {
                    selector += `#${current.id}`;
                    path.unshift(selector);
                    break;
                }
                
                const siblings = Array.from(current.parentNode?.children || [])
                    .filter(sibling => sibling.tagName === current.tagName);
                
                if (siblings.length > 1) {
                    const index = siblings.indexOf(current) + 1;
                    selector += `:nth-child(${index})`;
                }
                
                path.unshift(selector);
                current = current.parentNode;
            }
            
            return path.join(' > ');
        },

        // Check if element is visible and interactable
        isElementInteractable: (element) => {
            if (!element || !element.offsetParent) return false;
            
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            
            return (
                rect.width > 0 && 
                rect.height > 0 &&
                style.visibility !== 'hidden' &&
                style.display !== 'none' &&
                style.opacity !== '0' &&
                !element.disabled &&
                !element.hasAttribute('disabled')
            );
        },

        // Get element text content
        getElementText: (element) => {
            if (element.value !== undefined) return element.value;
            if (element.textContent) return element.textContent.trim();
            if (element.innerText) return element.innerText.trim();
            if (element.alt) return element.alt;
            if (element.title) return element.title;
            return '';
        },

        // Scroll element into view
        scrollIntoView: (element) => {
            element.scrollIntoView({
                behavior: CONSTANTS.SCROLL_BEHAVIOR,
                block: 'center',
                inline: 'center'
            });
            return new Promise(resolve => setTimeout(resolve, 500));
        },

        // Wait for element to be ready
        waitForElementReady: async (selector, timeout = CONSTANTS.DEFAULT_TIMEOUT) => {
            const startTime = Date.now();
            
            while (Date.now() - startTime < timeout) {
                const element = document.querySelector(selector);
                if (element && utils.isElementInteractable(element)) {
                    await utils.scrollIntoView(element);
                    return element;
                }
                await new Promise(resolve => setTimeout(resolve, CONSTANTS.ELEMENT_WAIT_INTERVAL));
            }
            
            throw new Error(`Element not found or not interactable: ${selector}`);
        },

        // Simulate human-like typing
        simulateTyping: async (element, text, delay = 50) => {
            element.focus();
            element.value = '';
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                element.value += char;
                
                // Dispatch input events
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('keydown', { bubbles: true }));
                element.dispatchEvent(new Event('keyup', { bubbles: true }));
                
                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('blur', { bubbles: true }));
        },

        // Enhanced click simulation
        simulateClick: async (element) => {
            await utils.scrollIntoView(element);
            
            // Dispatch mouse events in sequence
            const events = ['mousedown', 'mouseup', 'click'];
            for (const eventType of events) {
                element.dispatchEvent(new MouseEvent(eventType, {
                    bubbles: true,
                    cancelable: true,
                    view: window
                }));
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        },

        // Take screenshot (placeholder for future implementation)
        takeScreenshot: async () => {
            // This would require additional permissions and implementation
            console.log('Screenshot feature not yet implemented');
            return null;
        }
    };

    // === ENHANCED SELECTION MODE ===
    const enhancedSelectionMode = {
        isActive: false,
        selectableElements: [],
        overlayContainer: null,

        start: () => {
            if (enhancedSelectionMode.isActive) {
                enhancedSelectionMode.stop();
            }
            
            enhancedSelectionMode.isActive = true;
            enhancedSelectionMode.createOverlays();
            enhancedSelectionMode.addEventListeners();
        },

        stop: () => {
            enhancedSelectionMode.removeOverlays();
            enhancedSelectionMode.removeEventListeners();
            enhancedSelectionMode.selectableElements = [];
            enhancedSelectionMode.isActive = false;
        },

        createOverlays: () => {
            // Create overlay container
            enhancedSelectionMode.overlayContainer = document.createElement('div');
            enhancedSelectionMode.overlayContainer.id = CONSTANTS.OVERLAY_CONTAINER_ID;
            enhancedSelectionMode.overlayContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 999999;
            `;
            document.body.appendChild(enhancedSelectionMode.overlayContainer);

            // Find and overlay selectable elements
            const elements = Array.from(document.querySelectorAll(SELECTABLE_ELEMENTS_QUERY));
            let counter = 1;

            elements.forEach(element => {
                if (!utils.isElementInteractable(element)) return;

                const rect = element.getBoundingClientRect();
                if (rect.width < 5 || rect.height < 5) return;

                enhancedSelectionMode.selectableElements.push(element);

                const overlay = document.createElement('div');
                overlay.className = 'sisypi-selection-overlay';
                overlay.textContent = counter;
                overlay.style.cssText = `
                    position: absolute;
                    left: ${window.scrollX + rect.left}px;
                    top: ${window.scrollY + rect.top}px;
                    width: ${rect.width}px;
                    height: ${rect.height}px;
                    background: rgba(37, 99, 235, 0.2);
                    border: 2px solid #2563eb;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    font-size: 14px;
                    font-weight: bold;
                    color: #1e40af;
                    background-color: rgba(37, 99, 235, 0.9);
                    color: white;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    pointer-events: none;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    z-index: 1000000;
                `;

                enhancedSelectionMode.overlayContainer.appendChild(overlay);
                counter++;
            });
        },

        removeOverlays: () => {
            if (enhancedSelectionMode.overlayContainer) {
                enhancedSelectionMode.overlayContainer.remove();
                enhancedSelectionMode.overlayContainer = null;
            }
        },

        addEventListeners: () => {
            document.addEventListener('scroll', enhancedSelectionMode.updateOverlays);
            window.addEventListener('resize', enhancedSelectionMode.updateOverlays);
        },

        removeEventListeners: () => {
            document.removeEventListener('scroll', enhancedSelectionMode.updateOverlays);
            window.removeEventListener('resize', enhancedSelectionMode.updateOverlays);
        },

        updateOverlays: () => {
            if (!enhancedSelectionMode.isActive) return;
            enhancedSelectionMode.removeOverlays();
            enhancedSelectionMode.createOverlays();
        },

        getElementByNumber: (number) => {
            const index = number - 1;
            if (index >= 0 && index < enhancedSelectionMode.selectableElements.length) {
                const element = enhancedSelectionMode.selectableElements[index];
                return {
                    success: true,
                    elementData: {
                        selector: utils.generateSelector(element),
                        tagName: element.tagName.toLowerCase(),
                        text: utils.getElementText(element),
                        attributes: Array.from(element.attributes).reduce((acc, attr) => {
                            acc[attr.name] = attr.value;
                            return acc;
                        }, {}),
                        position: element.getBoundingClientRect()
                    }
                };
            }
            return { success: false, error: `Element ${number} not found` };
        }
    };

    // === ENHANCED AUTOMATION ENGINE ===
    const enhancedAutomationEngine = {
        isRunning: false,
        variables: {},
        executionLog: [],
        retryCount: {},

        // Status reporting
        sendStatus: (status) => {
            chrome.runtime.sendMessage({ action: 'updateRunStatus', status });
        },

        // Variable interpolation
        interpolateVariables: (text) => {
            if (typeof text !== 'string') return text;
            return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
                return enhancedAutomationEngine.variables[varName] || match;
            });
        },

        // Enhanced element waiting
        waitForElement: async (selector, timeout = CONSTANTS.DEFAULT_TIMEOUT) => {
            const interpolatedSelector = enhancedAutomationEngine.interpolateVariables(selector);
            return await utils.waitForElementReady(interpolatedSelector, timeout);
        },

        // Check if element exists
        elementExists: (selector) => {
            const interpolatedSelector = enhancedAutomationEngine.interpolateVariables(selector);
            return !!document.querySelector(interpolatedSelector);
        },

        // Execute individual step with retry logic
        executeStepWithRetry: async (step, stepIndex) => {
            const stepKey = `${stepIndex}-${step.type}`;
            const currentRetries = enhancedAutomationEngine.retryCount[stepKey] || 0;

            try {
                await enhancedAutomationEngine.executeStep(step, stepIndex);
                enhancedAutomationEngine.retryCount[stepKey] = 0; // Reset on success
            } catch (error) {
                if (currentRetries < CONSTANTS.MAX_RETRIES) {
                    enhancedAutomationEngine.retryCount[stepKey] = currentRetries + 1;
                    console.log(`Retrying step ${stepIndex + 1}, attempt ${currentRetries + 1}`);
                    await new Promise(resolve => setTimeout(resolve, CONSTANTS.RETRY_DELAY));
                    return await enhancedAutomationEngine.executeStepWithRetry(step, stepIndex);
                } else {
                    throw error;
                }
            }
        },

        // Execute individual step
        executeStep: async (step, stepIndex) => {
            const logEntry = {
                step: stepIndex + 1,
                type: step.type,
                timestamp: Date.now(),
                status: 'executing'
            };

            enhancedAutomationEngine.executionLog.push(logEntry);

            try {
                switch (step.type) {
                    case 'click':
                        await enhancedAutomationEngine.performClick(step);
                        break;
                    case 'type':
                        await enhancedAutomationEngine.performType(step);
                        break;
                    case 'copy':
                        await enhancedAutomationEngine.performCopy(step);
                        break;
                    case 'wait':
                        await enhancedAutomationEngine.performWait(step);
                        break;
                    case 'scroll':
                        await enhancedAutomationEngine.performScroll(step);
                        break;
                    case 'screenshot':
                        await enhancedAutomationEngine.performScreenshot(step);
                        break;
                    case 'comment':
                        // Comments are just logged
                        console.log(`Comment: ${step.text || 'No comment'}`);
                        break;
                    default:
                        throw new Error(`Unknown step type: ${step.type}`);
                }

                logEntry.status = 'completed';
                logEntry.completedAt = Date.now();

            } catch (error) {
                logEntry.status = 'failed';
                logEntry.error = error.message;
                logEntry.failedAt = Date.now();
                throw error;
            }
        },

        // Step implementations
        performClick: async (step) => {
            const element = await enhancedAutomationEngine.waitForElement(step.selector);
            await utils.simulateClick(element);
            await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause after click
        },

        performType: async (step) => {
            const element = await enhancedAutomationEngine.waitForElement(step.selector);
            const text = enhancedAutomationEngine.interpolateVariables(step.text || '');
            await utils.simulateTyping(element, text);
        },

        performCopy: async (step) => {
            const element = await enhancedAutomationEngine.waitForElement(step.selector);
            const text = utils.getElementText(element);
            if (step.variable) {
                enhancedAutomationEngine.variables[step.variable] = text;
                console.log(`Variable ${step.variable} set to: ${text}`);
            }
        },

        performWait: async (step) => {
            const duration = parseInt(step.duration) || 1000;
            await new Promise(resolve => setTimeout(resolve, duration));
        },

        performScroll: async (step) => {
            if (step.selector) {
                // Scroll to specific element
                const element = await enhancedAutomationEngine.waitForElement(step.selector);
                await utils.scrollIntoView(element);
            } else {
                // Scroll to bottom of page
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: CONSTANTS.SCROLL_BEHAVIOR
                });
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        },

        performScreenshot: async (step) => {
            // Placeholder for screenshot functionality
            await utils.takeScreenshot();
        },

        // Find matching control flow end
        findMatchingEnd: (steps, startIndex, startType, endType) => {
            let nestLevel = 1;
            for (let i = startIndex + 1; i < steps.length; i++) {
                if (steps[i].type === startType) nestLevel++;
                if (steps[i].type === endType) nestLevel--;
                if (nestLevel === 0) return i;
            }
            return steps.length - 1;
        },

        // Main execution function
        executeScenario: async (steps) => {
            if (enhancedAutomationEngine.isRunning) {
                throw new Error('Another scenario is already running');
            }

            enhancedAutomationEngine.isRunning = true;
            enhancedAutomationEngine.variables = {};
            enhancedAutomationEngine.executionLog = [];
            enhancedAutomationEngine.retryCount = {};

            enhancedAutomationEngine.sendStatus({
                type: 'running',
                messageKey: 'statusRunning'
            });

            const controlFlowStack = [];
            let currentStep = 0;

            try {
                while (currentStep < steps.length && enhancedAutomationEngine.isRunning) {
                    const step = steps[currentStep];

                    // Handle control flow
                    switch (step.type) {
                        case 'if_start': {
                            const condition = enhancedAutomationEngine.elementExists(step.selector);
                            controlFlowStack.push({ type: 'if', condition });
                            if (!condition) {
                                currentStep = enhancedAutomationEngine.findMatchingEnd(steps, currentStep, 'if_start', 'if_end');
                            }
                            break;
                        }
                        case 'else_block': {
                            const ifState = controlFlowStack[controlFlowStack.length - 1];
                            if (ifState && ifState.type === 'if' && ifState.condition) {
                                currentStep = enhancedAutomationEngine.findMatchingEnd(steps, currentStep, 'if_start', 'if_end');
                            }
                            break;
                        }
                        case 'if_end': {
                            controlFlowStack.pop();
                            break;
                        }
                        case 'loop_start': {
                            const repetitions = parseInt(enhancedAutomationEngine.interpolateVariables(step.repetitions)) || 1;
                            controlFlowStack.push({
                                type: 'loop',
                                count: repetitions,
                                start: currentStep,
                                current: 0
                            });
                            break;
                        }
                        case 'loop_end': {
                            const loopState = controlFlowStack[controlFlowStack.length - 1];
                            if (loopState && loopState.type === 'loop') {
                                loopState.current++;
                                if (loopState.current < loopState.count) {
                                    currentStep = loopState.start;
                                } else {
                                    controlFlowStack.pop();
                                }
                            }
                            break;
                        }
                        default: {
                            // Execute regular step
                            await enhancedAutomationEngine.executeStepWithRetry(step, currentStep);
                            break;
                        }
                    }

                    currentStep++;
                }

                if (enhancedAutomationEngine.isRunning) {
                    enhancedAutomationEngine.sendStatus({
                        type: 'success',
                        messageKey: 'statusSuccess'
                    });
                }

            } catch (error) {
                enhancedAutomationEngine.sendStatus({
                    type: 'error',
                    messageKey: 'statusError',
                    params: {
                        step: currentStep + 1,
                        message: error.message
                    }
                });
                throw error;
            } finally {
                enhancedAutomationEngine.isRunning = false;
            }
        },

        // Stop execution
        stop: () => {
            enhancedAutomationEngine.isRunning = false;
        },

        // Get execution log
        getExecutionLog: () => {
            return enhancedAutomationEngine.executionLog;
        }
    };

    // === MESSAGE LISTENER ===
    const messageListener = (request, sender, sendResponse) => {
        console.log('Enhanced content script received message:', request);

        try {
            switch (request.action) {
                case 'startSelection':
                    enhancedSelectionMode.start();
                    sendResponse({ success: true });
                    break;

                case 'stopSelection':
                case 'cleanupSelectionUI':
                    enhancedSelectionMode.stop();
                    sendResponse({ success: true });
                    break;

                case 'getElementDataByNumber':
                    const result = enhancedSelectionMode.getElementByNumber(request.elementNumber);
                    sendResponse(result);
                    break;

                case 'executeScenario':
                    enhancedAutomationEngine.executeScenario(request.steps)
                        .then(() => sendResponse({ success: true }))
                        .catch(error => sendResponse({ success: false, error: error.message }));
                    return true; // Async response

                case 'stopExecution':
                    enhancedAutomationEngine.stop();
                    sendResponse({ success: true });
                    break;

                case 'getExecutionLog':
                    sendResponse({
                        success: true,
                        log: enhancedAutomationEngine.getExecutionLog()
                    });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error in message listener:', error);
            sendResponse({ success: false, error: error.message });
        }
    };

    // Register message listener
    chrome.runtime.onMessage.addListener(messageListener);

    // Export to global scope
    window.sisypiEnhancedEngine = {
        selectionMode: enhancedSelectionMode,
        automationEngine: enhancedAutomationEngine,
        utils: utils
    };

    console.log('Sisypi: Enhanced automation engine initialized successfully');

})();