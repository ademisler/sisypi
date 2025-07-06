document.addEventListener('DOMContentLoaded', () => {
    const tabEditor = document.getElementById('tab-editor');
    const tabLibrary = document.getElementById('tab-library');
    const viewEditor = document.getElementById('editor-view');
    const viewLibrary = document.getElementById('library-view');
    const themeToggleButton = document.getElementById('theme-toggle');
    const popupContainer = document.querySelector('.sisypi-popup');

    const stepsList = document.querySelector('.steps-list');
    const libraryList = document.getElementById('library-list'); // Ensure this ID exists in popup.html

    // --- Tab Switching ---
    const showView = (viewToShow, tabToActivate) => {
        [viewEditor, viewLibrary].forEach(v => v.classList.remove('active'));
        [tabEditor, tabLibrary].forEach(t => t.classList.remove('active'));
        viewToShow.classList.add('active');
        tabToActivate.classList.add('active');
    };

    tabEditor.addEventListener('click', () => showView(viewEditor, tabEditor));
    tabLibrary.addEventListener('click', () => {
        showView(viewLibrary, tabLibrary);
        loadScenarios(); // Reload scenarios when library tab is clicked
    });

    // --- Theme Toggle ---
    const switchTheme = () => {
        const currentTheme = popupContainer.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        popupContainer.setAttribute('data-theme', newTheme);
        localStorage.setItem('sisypi-theme', newTheme);
    };

    themeToggleButton.addEventListener('click', switchTheme);

    const savedTheme = localStorage.getItem('sisypi-theme');
    if (savedTheme) {
        popupContainer.setAttribute('data-theme', savedTheme);
    }

    // --- SortableJS Initialization ---
    new Sortable(stepsList, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost'
    });

    // --- Element Selection (New Flow) ---
    const newStepButton = document.getElementById('new-step-button');
    newStepButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.runtime.sendMessage({ action: 'startElementSelection', tabId: tabs[0].id });
            } else {
                console.error("No active tab found.");
            }
            window.close(); // Close popup after sending message
        });
    });

    // --- Load and Render Current Scenario (from chrome.storage.local) ---
    function loadAndRenderScenario() {
        chrome.storage.local.get('currentScenario', (data) => {
            if (data.currentScenario) {
                renderScenario(data.currentScenario);
            } else {
                // If no current scenario, create a new one and save it
                const newScenario = {
                    id: `scenario-${Date.now()}`,
                    title: 'Yeni E-ticaret Senaryosu',
                    steps: []
                };
                chrome.storage.local.set({ currentScenario: newScenario }, () => {
                    renderScenario(newScenario);
                });
            }
        });
    }

    function renderScenario(scenario) {
        const scenarioTitleInput = document.querySelector('.scenario-title-input');
        scenarioTitleInput.value = scenario.title;
        stepsList.innerHTML = ''; // Clear existing steps

        scenario.steps.forEach(step => {
            addStepToEditor(step, stepsList); // Pass the entire step object and the parent element
        });
    }

    // --- Add Step to Editor (Modified to accept full step object and parent element) ---
    function addStepToEditor(step, parentElement) {
        const stepItem = document.createElement('div');
        stepItem.classList.add('step-item');
        stepItem.dataset.stepId = step.id;
        stepItem.dataset.selector = step.selector || ''; // Store selector in data attribute

        let stepHtml = '';

        if (step.type === 'conditional') {
            stepItem.classList.add('conditional');
            stepHtml = `
                <div class="conditional-if">
                    <div class="step-controls"><div class="drag-handle"><svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div></div>
                    <div class="step-content">
                        <input type="text" class="step-name" value="${step.name.substring(0, 30) + (step.name.length > 30 ? '...' : '')}">
                    </div>
                    <div class="step-actions">
                        <button title="Ayarlar" class="settings-button"><svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></button>
                        <button class="delete-step" title="Sil"><svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    </div>
                </div>
                <div class="conditional-steps"></div>
            `;
        } else {
            stepHtml = `
                <div class="step-controls"><div class="drag-handle"><svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div></div>
                <div class="step-content">
                    <input type="text" class="step-name" value="${step.name.substring(0, 30) + (step.name.length > 30 ? '...' : '')}">
                    <div class="step-details">
                        <select class="action-select">
                            <option value="Tıkla">Tıkla</option>
                            <option value="Değer Yaz">Değer Yaz</option>
                            <option value="Metni Kopyala">Metni Kopyala</option>
                            <option value="Bekle">Bekle</option>
                            <option value="Sayfayı Kaydır">Sayfayı Kaydır</option>
                            <option value="Elementi Bekle">Elementi Bekle</option>
                            <option value="Koşullu Adım">Koşullu Adım</option>
                        </select>
                        <input type="text" class="value-input" value="${step.value || ''}">
                    </div>
                </div>
                <div class="step-actions">
                    <button title="Ayarlar" class="settings-button"><svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></button>
                    <button class="delete-step" title="Sil"><svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
            `;
        }

        stepItem.innerHTML = stepHtml;
        parentElement.appendChild(stepItem);

        // Set the action type for normal steps
        if (step.type !== 'conditional') {
            const actionSelect = stepItem.querySelector('.action-select');
            if (actionSelect) {
                actionSelect.value = step.action; // Set the value first
                actionSelect.addEventListener('change', handleActionTypeChange);
                handleActionTypeChange({ target: actionSelect }); // Then trigger the change handler
            }
        }

        // Add event listener for delete button
        const deleteButton = stepItem.querySelector('.delete-step');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                stepItem.remove();
                // Save scenario after deletion
                chrome.storage.local.get('currentScenario', (data) => {
                    if (data.currentScenario) {
                        const updatedSteps = extractStepData(stepsList); // Re-extract all steps from DOM
                        data.currentScenario.steps = updatedSteps;
                        chrome.storage.local.set({ currentScenario: data.currentScenario }, () => {
                            console.log('Scenario updated after step deletion:', data.currentScenario);
                        });
                    }
                });
            });
        }

        // Add event listener for settings button
        const settingsButton = stepItem.querySelector('.settings-button');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                console.log('Ayarlar butonu tıklandı!', step.id);
                // Implement settings functionality here
            });
        }

        // Recursively render nested steps for conditional steps
        if (step.type === 'conditional' && step.nestedSteps && step.nestedSteps.length > 0) {
            const conditionalStepsContainer = stepItem.querySelector('.conditional-steps');
            if (conditionalStepsContainer) {
                step.nestedSteps.forEach(nestedStep => {
                    addStepToEditor(nestedStep, conditionalStepsContainer);
                });
            }
        }
    }

    // --- Handle Action Type Change ---
    function handleActionTypeChange(event) {
        console.log('handleActionTypeChange called.');
        const actionSelect = event.target;
        const stepDetails = actionSelect.closest('.step-details');
        const valueInput = stepDetails.querySelector('.value-input');

        const selectedAction = actionSelect.value;
        console.log('Selected Action:', selectedAction);

        if (valueInput) {
            console.log('Value Input found.');
            valueInput.style.display = 'block'; // Default to block
            switch (selectedAction) {
                case 'Tıkla':
                case 'Metni Kopyala':
                case 'Elementi Bekle':
                    valueInput.placeholder = 'Selector...';
                    break;
                case 'Değer Yaz':
                    valueInput.placeholder = 'Yazılacak değer...';
                    break;
                case 'Bekle':
                    valueInput.placeholder = 'Saniye (örn: 2.5)';
                    break;
                case 'Sayfayı Kaydır':
                    valueInput.placeholder = 'Hedef (örn: #elementId veya \'bottom\')';
                    break;
                case 'Koşullu Adım':
                    valueInput.style.display = 'none';
                    break;
                default:
                    valueInput.placeholder = '';
                    break;
            }
            console.log('Value Input Display:', valueInput.style.display, 'Placeholder:', valueInput.placeholder);
        } else {
            console.log('Value Input NOT found for step details:', stepDetails);
        }
    }

    // --- Save Scenario ---
    const saveScenarioButton = document.getElementById('save-scenario-button');
    saveScenarioButton.addEventListener('click', () => {
        const scenarioTitle = document.querySelector('.scenario-title-input').value;

        // Helper function to extract step data recursively
        function extractStepData(parentElement) {
            const extractedSteps = [];
            parentElement.querySelectorAll(':scope > .step-item').forEach(stepItem => {
                const stepId = stepItem.dataset.stepId;
                const stepName = stepItem.querySelector('.step-name').value;
                const isConditional = stepItem.classList.contains('conditional');

                let stepData = {
                    id: stepId,
                    name: stepName,
                    type: isConditional ? 'conditional' : 'normal'
                };

                if (isConditional) {
                    const conditionalStepsContainer = stepItem.querySelector('.conditional-steps');
                    stepData.condition = stepName; // use the name as selector condition
                    stepData.nestedSteps = extractStepData(conditionalStepsContainer); // Recursive call
                } else {
                    const actionType = stepItem.querySelector('.action-select').value;
                    const valueInput = stepItem.querySelector('.value-input');
                    const value = valueInput ? valueInput.value : '';
                    const selector = stepItem.dataset.selector; // Get selector from data attribute

                    stepData.action = actionType;
                    stepData.value = value;
                    stepData.selector = selector;
                }
                extractedSteps.push(stepData);
            });
            return extractedSteps;
        }

        const rootSteps = extractStepData(stepsList);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentUrl = tabs.length > 0 ? tabs[0].url : '';
            chrome.storage.local.get('currentScenario', (csData) => {
                const scenarioId = csData.currentScenario ? csData.currentScenario.id : `scenario-${Date.now()}`;
                const scenario = { id: scenarioId, title: scenarioTitle, url: currentUrl, steps: rootSteps };

                chrome.storage.sync.get({ scenarios: [] }, (data) => {
                    const scenarios = data.scenarios;
                    const existingScenarioIndex = scenarios.findIndex(s => s.id === scenarioId);
                    if (existingScenarioIndex > -1) {
                        scenarios[existingScenarioIndex] = scenario;
                    } else {
                        scenarios.push(scenario);
                    }
                    chrome.storage.sync.set({ scenarios: scenarios }, () => {
                        console.log('Scenario saved:', scenario);
                        alert('Senaryo kaydedildi!');
                        loadScenarios();
                    });
                });

                chrome.storage.local.set({ currentScenario: scenario });
            });
        });
    });

    // --- Run Scenario ---
    const runScenarioButton = document.getElementById('run-scenario-button');
    runScenarioButton.addEventListener('click', () => {
        const scenarioTitle = document.querySelector('.scenario-title-input').value;

        function extractRunStepData(parentElement) {
            const extractedSteps = [];
            parentElement.querySelectorAll(':scope > .step-item').forEach(stepItem => {
                const stepName = stepItem.querySelector('.step-name').value;
                const isConditional = stepItem.classList.contains('conditional');

                let stepData = {
                    name: stepName,
                    type: isConditional ? 'conditional' : 'normal'
                };

                if (isConditional) {
                    const conditionalStepsContainer = stepItem.querySelector('.conditional-steps');
                    stepData.condition = stepName; // name used as selector
                    stepData.nestedSteps = extractRunStepData(conditionalStepsContainer); // Recursive call
                } else {
                    const actionType = stepItem.querySelector('.action-select').value;
                    const valueInput = stepItem.querySelector('.value-input');
                    const value = valueInput ? valueInput.value : '';
                    const selector = stepItem.dataset.selector; // Get selector from data attribute

                    stepData.action = actionType;
                    stepData.value = value;
                    stepData.selector = selector;
                }
                extractedSteps.push(stepData);
            });
            return extractedSteps;
        }

        chrome.tabs.query({ active: true, currentWindow: true, url: ["http://*/*", "https://*/*"] }, (tabs) => {
            if (tabs.length > 0) {
                const scenarioToRun = { title: scenarioTitle, url: tabs[0].url, steps: extractRunStepData(stepsList) };
                chrome.runtime.sendMessage({ action: "runScenario", scenario: scenarioToRun, tabId: tabs[0].id });
            } else {
                alert("Senaryoyu çalıştırmak için aktif bir web sayfası sekmesi bulunamadı.");
            }
        });
    });

    // --- Load Scenarios for Library View (from chrome.storage.sync) ---
    function loadScenarios() {
        libraryList.innerHTML = ''; // Clear current list
        chrome.storage.sync.get({ scenarios: [] }, (data) => {
            data.scenarios.forEach(scenario => {
                const libraryItem = document.createElement('div');
                libraryItem.classList.add('library-item');
                libraryItem.innerHTML = `
                    <div class="library-item-info">
                        <span class="library-title">${scenario.title}</span>
                        <span class="library-url">${scenario.url}</span>
                    </div>
                    <div class="library-item-actions">
                        <button title="Çalıştır" data-id="${scenario.id}" class="run-library-scenario"><svg class="icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button>
                        <button title="Düzenle" data-id="${scenario.id}" class="edit-library-scenario"><svg class="icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                        <button title="Dışa Aktar" data-id="${scenario.id}" class="export-library-scenario"><svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg></button>
                        <button title="Sil" class="btn-delete" data-id="${scenario.id}"><svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    </div>
                `;
                libraryList.appendChild(libraryItem);

                // Add event listeners for library item buttons
                const runLibraryScenarioButton = libraryItem.querySelector('.run-library-scenario');
                if (runLibraryScenarioButton) {
                    runLibraryScenarioButton.addEventListener('click', (e) => {
                        const id = e.currentTarget.dataset.id;
                        const scenarioToRun = data.scenarios.find(s => s.id === id);
                        if (scenarioToRun) {
                            chrome.tabs.query({ active: true, currentWindow: true, url: ["http://*/*", "https://*/*"] }, (tabs) => {
                                if (tabs.length > 0) {
                                    chrome.runtime.sendMessage({ action: "runScenario", scenario: scenarioToRun, tabId: tabs[0].id });
                                } else {
                                    console.error("No active web page tab found to run scenario from library.");
                                }
                            });
                        }
                    });
                }

                const editLibraryScenarioButton = libraryItem.querySelector('.edit-library-scenario');
                if (editLibraryScenarioButton) {
                    editLibraryScenarioButton.addEventListener('click', (e) => {
                        const id = e.currentTarget.dataset.id;
                        const scenarioToEdit = data.scenarios.find(s => s.id === id);
                        if (scenarioToEdit) {
                            // Load scenario into editor
                            chrome.storage.local.set({ currentScenario: scenarioToEdit }, () => {
                                loadAndRenderScenario(); // Re-render editor with the selected scenario
                                showView(viewEditor, tabEditor); // Switch to editor view
                            });
                        }
                    });
                }

                const exportLibraryScenarioButton = libraryItem.querySelector('.export-library-scenario');
                if (exportLibraryScenarioButton) {
                    exportLibraryScenarioButton.addEventListener('click', (e) => {
                        const id = e.currentTarget.dataset.id;
                        const scenarioToExport = data.scenarios.find(s => s.id === id);
                        if (scenarioToExport) {
                            const filename = `${scenarioToExport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
                            const blob = new Blob([JSON.stringify(scenarioToExport, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            chrome.downloads.download({
                                url: url,
                                filename: filename,
                                saveAs: true
                            });
                        }
                    });
                }

                const deleteLibraryScenarioButton = libraryItem.querySelector('.btn-delete'); // Corrected class name
                if (deleteLibraryScenarioButton) {
                    deleteLibraryScenarioButton.addEventListener('click', (e) => {
                        const id = e.currentTarget.dataset.id;
                        if (confirm('Bu senaryoyu silmek istediğinizden emin misiniz?')) {
                            chrome.storage.sync.get({ scenarios: [] }, (data) => {
                                const updatedScenarios = data.scenarios.filter(s => s.id !== id);
                                chrome.storage.sync.set({ scenarios: updatedScenarios }, () => {
                                    console.log('Scenario deleted:', id);
                                    loadScenarios(); // Refresh library view
                                });
                            });
                        }
                    });
                }
            });
        });
    }

    // --- Import Scenario ---
    let importScenarioButton = document.getElementById('import-scenario-button');
    importScenarioButton.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const importedScenario = JSON.parse(event.target.result);
                        // Assign a new ID to avoid conflicts
                        importedScenario.id = Date.now().toString();
                        chrome.storage.sync.get({ scenarios: [] }, (data) => {
                            const scenarios = data.scenarios;
                            scenarios.push(importedScenario);
                            chrome.storage.sync.set({ scenarios: scenarios }, () => {
                                console.log('Scenario imported:', importedScenario);
                                alert('Senaryo başarıyla içe aktarıldı!');
                                loadScenarios(); // Refresh library view
                            });
                        });
                    } catch (error) {
                        alert('Geçersiz JSON dosyası.');
                        console.error('Error parsing JSON:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    });

    // Initial load of current scenario when popup opens
    loadAndRenderScenario();
});
