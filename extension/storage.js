// Chrome storage wrapper for saving and loading scenarios

// Save steps under a given scenario name
function saveScenario(name, steps) {
  return chrome.storage.local.set({ [name]: steps });
}

// Load a single scenario by name
function loadScenario(name, callback) {
  chrome.storage.local.get([name], (result) => {
    callback(result[name] || []);
  });
}

// Load all scenarios
function loadAllScenarios(callback) {
  chrome.storage.local.get(null, callback);
}

// Remove a scenario
function deleteScenario(name, callback) {
  chrome.storage.local.remove(name, callback);
}

// Expose globally for background scripts
self.saveScenario = saveScenario;
self.loadScenario = loadScenario;
self.loadAllScenarios = loadAllScenarios;
self.deleteScenario = deleteScenario;
