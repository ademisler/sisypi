// === ENHANCED BACKGROUND SERVICE WORKER ===
// Professional background script with security, performance, and reliability features

console.log('Sisypi: Enhanced background service worker initializing...');

// === SECURITY MANAGER ===
class BackgroundSecurity {
  static validateMessage(message) {
    if (!message || typeof message !== 'object') {
      return false;
    }

    const allowedActions = [
      'getInitialData',
      'saveScenarios', 
      'runScenario',
      'backupAll',
      'restoreFromBackup',
      'startSelection',
      'stopSelection',
      'selectElementByNumber',
      'updateRunStatus'
    ];

    if (!message.action || !allowedActions.includes(message.action)) {
      this.logSecurityEvent('invalid_action', { action: message.action }, 'medium');
      return false;
    }

    return true;
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/eval\s*\(/gi, '')
      .trim();
  }

  static validateScenarioData(scenario) {
    if (!scenario || typeof scenario !== 'object') return false;
    if (!scenario.id || !scenario.title || !Array.isArray(scenario.steps)) return false;
    
    // Sanitize scenario data
    scenario.title = this.sanitizeInput(scenario.title);
    if (scenario.urlRestriction) {
      scenario.urlRestriction = this.sanitizeInput(scenario.urlRestriction);
    }

    // Validate steps
    for (const step of scenario.steps) {
      if (step.selector) step.selector = this.sanitizeInput(step.selector);
      if (step.text) step.text = this.sanitizeInput(step.text);
      if (step.variable && !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(step.variable)) {
        return false;
      }
    }

    return true;
  }

  static logSecurityEvent(action, details, risk = 'low') {
    const timestamp = new Date().toISOString();
    console.log(`[SECURITY-${risk.toUpperCase()}] ${timestamp}: ${action}`, details);
    
    if (risk === 'high') {
      console.warn(`[SECURITY ALERT] High-risk event detected: ${action}`, details);
    }
  }
}

// === RATE LIMITING ===
class RateLimiter {
  constructor() {
    this.calls = new Map();
    this.limit = 100; // calls per minute
    this.window = 60000; // 1 minute
  }

  checkRateLimit(identifier) {
    const now = Date.now();
    const record = this.calls.get(identifier);

    if (!record || now > record.resetTime) {
      this.calls.set(identifier, { count: 1, resetTime: now + this.window });
      return true;
    }

    if (record.count >= this.limit) {
      BackgroundSecurity.logSecurityEvent('rate_limit_exceeded', { identifier }, 'high');
      return false;
    }

    record.count++;
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.calls.entries()) {
      if (now > record.resetTime) {
        this.calls.delete(key);
      }
    }
  }
}

// === PERFORMANCE MONITOR ===
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name);
    values.push({ value, timestamp: Date.now() });
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetricStats(name) {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const nums = values.map(v => v.value);
    const sum = nums.reduce((a, b) => a + b, 0);
    
    return {
      count: nums.length,
      avg: sum / nums.length,
      min: Math.min(...nums),
      max: Math.max(...nums),
      recent: nums[nums.length - 1]
    };
  }

  getDiagnostics() {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = 'memory' in performance ? {
      used: performance.memory?.usedJSHeapSize || 0,
      total: performance.memory?.totalJSHeapSize || 0,
      limit: performance.memory?.jsHeapSizeLimit || 0
    } : null;

    return {
      uptime,
      memoryUsage,
      metrics: Object.fromEntries(
        Array.from(this.metrics.keys()).map(key => [key, this.getMetricStats(key)])
      )
    };
  }
}

// === ENHANCED STORAGE MANAGER ===
class StorageManager {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  async get(keys) {
    const startTime = performance.now();
    try {
      // Check cache first
      const cacheKey = Array.isArray(keys) ? keys.join(',') : keys;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        performanceMonitor.recordMetric('storage_cache_hit', performance.now() - startTime);
        return cached.data;
      }

      // Fetch from storage
      const data = await chrome.storage.local.get(keys);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      performanceMonitor.recordMetric('storage_read', performance.now() - startTime);
      return data;
    } catch (error) {
      performanceMonitor.recordMetric('storage_error', performance.now() - startTime);
      throw error;
    }
  }

  async set(data) {
    const startTime = performance.now();
    try {
      await chrome.storage.local.set(data);
      
      // Update cache
      for (const [key, value] of Object.entries(data)) {
        this.cache.set(key, {
          data: { [key]: value },
          timestamp: Date.now()
        });
      }

      performanceMonitor.recordMetric('storage_write', performance.now() - startTime);
    } catch (error) {
      performanceMonitor.recordMetric('storage_error', performance.now() - startTime);
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

// === INITIALIZATION ===
const rateLimiter = new RateLimiter();
const performanceMonitor = new PerformanceMonitor();
const storageManager = new StorageManager();

// === APPLICATION STATE ===
let scenarios = {};
let appState = {
  currentView: 'main',
  activeScenarioId: null,
  language: 'en'
};
let activeSelectionTabId = null;

// === UTILITY FUNCTIONS ===
const loadInitialData = async () => {
  const startTime = performance.now();
  try {
    const data = await storageManager.get(['scenarios', 'appState']);
    scenarios = data.scenarios || {};
    appState = {
      currentView: 'main',
      activeScenarioId: null,
      language: (data.appState && data.appState.language) || 'en'
    };
    
    performanceMonitor.recordMetric('load_initial_data', performance.now() - startTime);
    console.log("Enhanced Background: Initial data loaded.", { 
      scenarioCount: Object.keys(scenarios).length, 
      appState 
    });
  } catch (error) {
    performanceMonitor.recordMetric('load_error', performance.now() - startTime);
    console.error("Failed to load initial data:", error);
    throw error;
  }
};

const saveScenarios = async (newScenarios) => {
  const startTime = performance.now();
  try {
    // Validate all scenarios
    for (const scenario of Object.values(newScenarios)) {
      if (!BackgroundSecurity.validateScenarioData(scenario)) {
        throw new Error('Invalid scenario data detected');
      }
    }

    scenarios = newScenarios;
    await storageManager.set({ scenarios });
    
    performanceMonitor.recordMetric('save_scenarios', performance.now() - startTime);
    console.log(`Enhanced Background: Saved ${Object.keys(scenarios).length} scenarios`);
  } catch (error) {
    performanceMonitor.recordMetric('save_error', performance.now() - startTime);
    BackgroundSecurity.logSecurityEvent('save_scenarios_failed', { error: error.message }, 'medium');
    throw error;
  }
};

const saveAppState = async () => {
  try {
    await storageManager.set({ appState });
  } catch (error) {
    console.error("Failed to save app state:", error);
  }
};

const sendStatusUpdateToPopup = (status) => {
  try {
    chrome.runtime.sendMessage({ 
      action: 'updateRunStatus', 
      status: status 
    }).catch(e => {
      // Popup not open, this is normal
      console.log("Popup not available for status update");
    });
  } catch (error) {
    console.error("Failed to send status update:", error);
  }
};

// === ENHANCED MESSAGE HANDLER ===
const handleMessage = async (request, sender, sendResponse) => {
  const startTime = performance.now();
  const senderIdentifier = sender.tab ? `tab_${sender.tab.id}` : 'popup';
  
  try {
    // Rate limiting
    if (!rateLimiter.checkRateLimit(senderIdentifier)) {
      sendResponse({ 
        success: false, 
        error: 'Rate limit exceeded. Please slow down.' 
      });
      return;
    }

    // Security validation
    if (!BackgroundSecurity.validateMessage(request)) {
      BackgroundSecurity.logSecurityEvent('invalid_message', request, 'medium');
      sendResponse({ 
        success: false, 
        error: 'Invalid message format or action' 
      });
      return;
    }

    console.log("Enhanced Background received message:", request.action);

    // Handle different actions
    switch (request.action) {
      case 'getInitialData':
        await loadInitialData();
        sendResponse({ 
          success: true,
          scenarios, 
          appState, 
          language: appState.language 
        });
        break;

      case 'saveScenarios':
        await saveScenarios(request.scenarios);
        sendResponse({ success: true });
        break;

      case 'runScenario':
        // Get active tab if sender.tab is not available (popup case)
        const tab = sender.tab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
        if (!tab) {
          throw new Error('No active tab found');
        }
        await runScenario(request.scenarioId, request.allScenarios, tab);
        sendResponse({ success: true });
        break;

      case 'backupAll':
        handleBackupAll();
        sendResponse({ success: true });
        break;

      case 'restoreFromBackup':
        await handleRestoreFromBackup(request.data);
        sendResponse({ success: true });
        break;

      case 'startSelection':
        await handleStartSelection(sender.tab);
        sendResponse({ success: true });
        break;

      case 'stopSelection':
        await handleStopSelection();
        sendResponse({ success: true });
        break;

      case 'selectElementByNumber':
        const result = await handleSelectElementByNumber(request.elementNumber, sender.tab);
        sendResponse(result);
        break;

      case 'updateRunStatus':
        sendStatusUpdateToPopup(request.status);
        sendResponse({ success: true });
        break;

      case 'getPerformanceStats':
        sendResponse({
          success: true,
          stats: performanceMonitor.getDiagnostics()
        });
        break;

      default:
        BackgroundSecurity.logSecurityEvent('unknown_action', { action: request.action }, 'low');
        sendResponse({ 
          success: false, 
          error: `Unknown action: ${request.action}` 
        });
    }

    performanceMonitor.recordMetric(`action_${request.action}`, performance.now() - startTime);

  } catch (error) {
    performanceMonitor.recordMetric(`error_${request.action}`, performance.now() - startTime);
    BackgroundSecurity.logSecurityEvent('message_handler_error', {
      action: request.action,
      error: error.message
    }, 'high');
    
    console.error(`Error handling ${request.action}:`, error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
};

// === SCENARIO EXECUTION ===
const runScenario = async (scenarioId, allScenarios, tab) => {
  const startTime = performance.now();
  try {
    const scenario = allScenarios[scenarioId];
    if (!scenario) {
      throw new Error('Scenario not found');
    }

    // Validate scenario before execution
    if (!BackgroundSecurity.validateScenarioData(scenario)) {
      throw new Error('Scenario failed security validation');
    }

    console.log(`Running scenario: ${scenario.title}`);
    
    // Check URL restriction
    if (scenario.urlRestriction && !tab.url.includes(scenario.urlRestriction)) {
      throw new Error(`URL restriction not met. Expected: ${scenario.urlRestriction}, Current: ${tab.url}`);
    }

    sendStatusUpdateToPopup({
      type: 'running',
      messageKey: 'statusRunning'
    });

    // Execute scenario in content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'executeScenario',
      steps: scenario.steps
    });

    if (response && response.success) {
      sendStatusUpdateToPopup({
        type: 'success',
        messageKey: 'statusSuccess'
      });
      performanceMonitor.recordMetric('scenario_execution_success', performance.now() - startTime);
    } else {
      throw new Error(response?.error || 'Scenario execution failed');
    }

  } catch (error) {
    performanceMonitor.recordMetric('scenario_execution_error', performance.now() - startTime);
    sendStatusUpdateToPopup({
      type: 'error',
      messageKey: 'statusError',
      params: { message: error.message }
    });
    throw error;
  }
};

// === ELEMENT SELECTION HANDLERS ===
const handleStartSelection = async (tab) => {
  try {
    activeSelectionTabId = tab.id;
    await chrome.tabs.sendMessage(tab.id, { action: 'startSelection' });
  } catch (error) {
    console.error('Failed to start selection:', error);
    throw error;
  }
};

const handleStopSelection = async () => {
  try {
    if (activeSelectionTabId) {
      await chrome.tabs.sendMessage(activeSelectionTabId, { action: 'stopSelection' });
      activeSelectionTabId = null;
    }
  } catch (error) {
    console.error('Failed to stop selection:', error);
  }
};

const handleSelectElementByNumber = async (elementNumber, tab) => {
  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'getElementDataByNumber',
      elementNumber
    });
    
    if (response && response.success) {
      // Stop selection after successful selection
      await handleStopSelection();
      return response;
    } else {
      throw new Error(response?.error || 'Element selection failed');
    }
  } catch (error) {
    console.error('Failed to select element:', error);
    return { success: false, error: error.message };
  }
};

// === BACKUP/RESTORE HANDLERS ===
const handleBackupAll = () => {
  try {
    const backupData = {
      scenarios,
      appState,
      timestamp: Date.now(),
      version: '2.0.0'
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const filename = `sisypi-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });

    performanceMonitor.recordMetric('backup_created', 1);
    console.log('Backup created successfully');
  } catch (error) {
    console.error('Backup creation failed:', error);
    throw error;
  }
};

const handleRestoreFromBackup = async (backupData) => {
  try {
    // Validate backup data
    if (!backupData || !backupData.scenarios) {
      throw new Error('Invalid backup data format');
    }

    // Validate all scenarios in backup
    for (const scenario of Object.values(backupData.scenarios)) {
      if (!BackgroundSecurity.validateScenarioData(scenario)) {
        throw new Error('Backup contains invalid scenario data');
      }
    }

    scenarios = backupData.scenarios;
    if (backupData.appState) {
      appState = { ...appState, ...backupData.appState };
    }

    await storageManager.set({ scenarios, appState });
    
    performanceMonitor.recordMetric('backup_restored', 1);
    console.log('Backup restored successfully');
  } catch (error) {
    BackgroundSecurity.logSecurityEvent('backup_restore_failed', { error: error.message }, 'medium');
    console.error('Backup restore failed:', error);
    throw error;
  }
};

// === CLEANUP & MAINTENANCE ===
const performMaintenance = () => {
  try {
    // Clean up rate limiter
    rateLimiter.cleanup();
    
    // Clear storage cache periodically
    if (Math.random() < 0.1) { // 10% chance
      storageManager.clearCache();
    }

    console.log('Maintenance completed');
  } catch (error) {
    console.error('Maintenance failed:', error);
  }
};

// === EVENT LISTENERS ===
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Keep message channel open for async responses
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Enhanced Background: Extension startup');
  loadInitialData().catch(console.error);
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Enhanced Background: Extension installed/updated', details);
  loadInitialData().catch(console.error);
});

// === PERIODIC MAINTENANCE ===
setInterval(performMaintenance, 5 * 60 * 1000); // Every 5 minutes

// === INITIALIZATION ===
loadInitialData().then(() => {
  console.log('Sisypi: Enhanced background service worker ready');
}).catch(error => {
  console.error('Failed to initialize background script:', error);
});

console.log('Sisypi: Enhanced background service worker initialized');