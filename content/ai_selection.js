// AI-Enhanced Element Selection for Sisypi
// Uses mouse click instead of numbers for better UX

(function() {
    'use strict';

    if (window.sisypiAISelection) {
        console.log('Sisypi AI Selection already initialized');
        return;
    }

    console.log('Sisypi: Initializing AI-enhanced element selection');

    // === CONSTANTS ===
    const CONSTANTS = {
        OVERLAY_CONTAINER_ID: 'sisypi-ai-overlay',
        HIGHLIGHT_CLASS: 'sisypi-ai-highlight',
        SELECTION_CLASS: 'sisypi-ai-selected',
        Z_INDEX: 2147483647
    };

    // Enhanced selectable elements query
    const SELECTABLE_QUERY = [
        'a', 'button', 'input:not([type="hidden"])', 'select', 'textarea',
        '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]',
        '[onclick]', '[onmousedown]', '[onmouseup]', '[contenteditable="true"]',
        '.btn', '.button', '.clickable', '.link', '[data-testid]', '[data-cy]',
        'img[alt]', 'span[onclick]', 'div[onclick]', 'li[onclick]',
        '[tabindex]:not([tabindex="-1"])', 'form', 'fieldset', 'legend'
    ].join(', ');

    // === UTILITY FUNCTIONS ===
    const utils = {
        isElementVisible: (element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            
            return (
                rect.width > 0 && 
                rect.height > 0 &&
                rect.top < window.innerHeight &&
                rect.bottom > 0 &&
                rect.left < window.innerWidth &&
                rect.right > 0 &&
                style.visibility !== 'hidden' &&
                style.display !== 'none' &&
                parseFloat(style.opacity) > 0.1 &&
                !element.disabled &&
                !element.hasAttribute('disabled')
            );
        },

        getElementContext: (element) => {
            const parent = element.parentElement;
            const siblings = parent ? Array.from(parent.children) : [];
            const index = siblings.indexOf(element);
            
            return {
                parent: parent ? parent.tagName.toLowerCase() : null,
                siblings: siblings.length,
                index: index,
                nextSibling: siblings[index + 1]?.tagName.toLowerCase() || null,
                prevSibling: siblings[index - 1]?.tagName.toLowerCase() || null
            };
        },

        generateSelector: (element) => {
            // Try ID first
            if (element.id && document.querySelectorAll(`#${element.id}`).length === 1) {
                return `#${element.id}`;
            }

            // Try data attributes
            const testId = element.getAttribute('data-testid') || element.getAttribute('data-cy') || element.getAttribute('data-test');
            if (testId && document.querySelectorAll(`[data-testid="${testId}"], [data-cy="${testId}"], [data-test="${testId}"]`).length === 1) {
                return `[data-testid="${testId}"]`;
            }

            // Try class combination
            if (element.className && typeof element.className === 'string') {
                const classes = element.className.split(' ').filter(c => c && !c.includes('sisypi'));
                if (classes.length > 0) {
                    const selector = `${element.tagName.toLowerCase()}.${classes.join('.')}`;
                    if (document.querySelectorAll(selector).length === 1) {
                        return selector;
                    }
                }
            }

            // Try nth-child approach
            const parent = element.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
                const index = siblings.indexOf(element);
                if (index >= 0) {
                    return `${element.tagName.toLowerCase()}:nth-of-type(${index + 1})`;
                }
            }

            // Fallback to tag name
            return element.tagName.toLowerCase();
        },

        getElementData: (element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            
            // Get all attributes
            const attributes = {};
            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                attributes[attr.name] = attr.value;
            }

            // Get surrounding context HTML
            const parent = element.parentElement;
            const context = parent ? parent.innerHTML.substring(0, 500) : '';

            return {
                tagName: element.tagName,
                id: element.id || null,
                className: element.className || null,
                textContent: (element.textContent || '').trim().substring(0, 100),
                value: element.value || null,
                placeholder: element.placeholder || null,
                attributes: attributes,
                context: context,
                selector: utils.generateSelector(element),
                bounds: {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height
                },
                styles: {
                    display: style.display,
                    visibility: style.visibility,
                    opacity: style.opacity
                },
                elementContext: utils.getElementContext(element)
            };
        }
    };

    // === AI SELECTION MANAGER ===
    const aiSelectionManager = {
        isActive: false,
        overlayContainer: null,
        selectedElement: null,
        hoveredElement: null,
        onElementSelected: null,

        start: (callback) => {
            if (aiSelectionManager.isActive) {
                aiSelectionManager.stop();
            }

            aiSelectionManager.isActive = true;
            aiSelectionManager.onElementSelected = callback;
            aiSelectionManager.createOverlay();
            aiSelectionManager.addEventListeners();
            
            console.log('Sisypi AI Selection: Started');
        },

        stop: () => {
            aiSelectionManager.removeOverlay();
            aiSelectionManager.removeEventListeners();
            aiSelectionManager.selectedElement = null;
            aiSelectionManager.hoveredElement = null;
            aiSelectionManager.onElementSelected = null;
            aiSelectionManager.isActive = false;
            
            console.log('Sisypi AI Selection: Stopped');
        },

        createOverlay: () => {
            // Create overlay container
            aiSelectionManager.overlayContainer = document.createElement('div');
            aiSelectionManager.overlayContainer.id = CONSTANTS.OVERLAY_CONTAINER_ID;
            aiSelectionManager.overlayContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: ${CONSTANTS.Z_INDEX};
                background: rgba(0, 0, 0, 0.1);
            `;
            document.body.appendChild(aiSelectionManager.overlayContainer);

            // Add instruction tooltip
            const instruction = document.createElement('div');
            instruction.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #1e40af;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: ${CONSTANTS.Z_INDEX + 1};
                pointer-events: none;
            `;
            instruction.textContent = '🤖 AI Selection Mode: Hover over elements and click to select';
            aiSelectionManager.overlayContainer.appendChild(instruction);
        },

        removeOverlay: () => {
            if (aiSelectionManager.overlayContainer) {
                aiSelectionManager.overlayContainer.remove();
                aiSelectionManager.overlayContainer = null;
            }
            
            // Remove all highlights
            document.querySelectorAll(`.${CONSTANTS.HIGHLIGHT_CLASS}, .${CONSTANTS.SELECTION_CLASS}`).forEach(el => {
                el.classList.remove(CONSTANTS.HIGHLIGHT_CLASS, CONSTANTS.SELECTION_CLASS);
            });
        },

        addEventListeners: () => {
            document.addEventListener('mouseover', aiSelectionManager.handleMouseOver, true);
            document.addEventListener('mouseout', aiSelectionManager.handleMouseOut, true);
            document.addEventListener('click', aiSelectionManager.handleClick, true);
            document.addEventListener('keydown', aiSelectionManager.handleKeyDown, true);
        },

        removeEventListeners: () => {
            document.removeEventListener('mouseover', aiSelectionManager.handleMouseOver, true);
            document.removeEventListener('mouseout', aiSelectionManager.handleMouseOut, true);
            document.removeEventListener('click', aiSelectionManager.handleClick, true);
            document.removeEventListener('keydown', aiSelectionManager.handleKeyDown, true);
        },

        handleMouseOver: (event) => {
            if (!aiSelectionManager.isActive) return;
            
            const element = event.target;
            if (!element || element.closest(`#${CONSTANTS.OVERLAY_CONTAINER_ID}`)) return;
            
            // Check if element is selectable
            if (!element.matches(SELECTABLE_QUERY) || !utils.isElementVisible(element)) return;

            // Remove previous highlight
            if (aiSelectionManager.hoveredElement) {
                aiSelectionManager.hoveredElement.classList.remove(CONSTANTS.HIGHLIGHT_CLASS);
            }

            // Add highlight to current element
            element.classList.add(CONSTANTS.HIGHLIGHT_CLASS);
            aiSelectionManager.hoveredElement = element;

            // Add highlight styles if not already added
            if (!document.getElementById('sisypi-ai-styles')) {
                const styles = document.createElement('style');
                styles.id = 'sisypi-ai-styles';
                styles.textContent = `
                    .${CONSTANTS.HIGHLIGHT_CLASS} {
                        outline: 3px solid #3b82f6 !important;
                        outline-offset: 2px !important;
                        background-color: rgba(59, 130, 246, 0.1) !important;
                        cursor: crosshair !important;
                    }
                    .${CONSTANTS.SELECTION_CLASS} {
                        outline: 3px solid #10b981 !important;
                        outline-offset: 2px !important;
                        background-color: rgba(16, 185, 129, 0.2) !important;
                    }
                `;
                document.head.appendChild(styles);
            }
        },

        handleMouseOut: (event) => {
            if (!aiSelectionManager.isActive) return;
            
            const element = event.target;
            if (element && element.classList.contains(CONSTANTS.HIGHLIGHT_CLASS)) {
                element.classList.remove(CONSTANTS.HIGHLIGHT_CLASS);
            }
        },

        handleClick: (event) => {
            if (!aiSelectionManager.isActive) return;
            
            event.preventDefault();
            event.stopPropagation();
            
            const element = event.target;
            if (!element || element.closest(`#${CONSTANTS.OVERLAY_CONTAINER_ID}`)) return;
            
            if (!element.matches(SELECTABLE_QUERY) || !utils.isElementVisible(element)) return;

            // Mark as selected
            if (aiSelectionManager.selectedElement) {
                aiSelectionManager.selectedElement.classList.remove(CONSTANTS.SELECTION_CLASS);
            }
            
            element.classList.remove(CONSTANTS.HIGHLIGHT_CLASS);
            element.classList.add(CONSTANTS.SELECTION_CLASS);
            aiSelectionManager.selectedElement = element;

            // Get element data
            const elementData = utils.getElementData(element);
            
            console.log('Sisypi AI Selection: Element selected', elementData);

            // Call callback
            if (aiSelectionManager.onElementSelected) {
                aiSelectionManager.onElementSelected(elementData);
            }

            // Stop selection after selection
            setTimeout(() => {
                aiSelectionManager.stop();
            }, 1000);
        },

        handleKeyDown: (event) => {
            if (!aiSelectionManager.isActive) return;
            
            // ESC to cancel
            if (event.key === 'Escape') {
                event.preventDefault();
                aiSelectionManager.stop();
            }
        }
    };

    // === MESSAGE LISTENER ===
    const messageListener = (request, sender, sendResponse) => {
        console.log('Sisypi AI Selection received message:', request);

        try {
            switch (request.action) {
                case 'startAISelection':
                    aiSelectionManager.start((elementData) => {
                        // Send element data back to popup
                        chrome.runtime.sendMessage({
                            action: 'aiElementSelected',
                            elementData: elementData
                        });
                    });
                    sendResponse({ success: true });
                    break;

                case 'stopAISelection':
                    aiSelectionManager.stop();
                    sendResponse({ success: true });
                    break;

                case 'isAISelectionActive':
                    sendResponse({ 
                        success: true, 
                        active: aiSelectionManager.isActive 
                    });
                    break;

                default:
                    // Let other scripts handle other actions
                    return false;
            }
        } catch (error) {
            console.error('Sisypi AI Selection error:', error);
            sendResponse({ success: false, error: error.message });
        }

        return true;
    };

    // Register message listener
    chrome.runtime.onMessage.addListener(messageListener);

    // Export to global scope
    window.sisypiAISelection = {
        manager: aiSelectionManager,
        utils: utils
    };

    console.log('Sisypi: AI-enhanced element selection initialized');

})();