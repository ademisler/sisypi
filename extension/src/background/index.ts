import { runScenario } from './runner';
import { saveScenario, STORAGE_KEYS, getScenarioById } from '../popup/services/storage';
import type { Scenario, Block } from '../popup/types';

console.log('Sisypi Background Service Worker Started.');

// The main message router for the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type, message.payload);

  if (message.type === 'RUN_SCENARIO') {
    (async () => {
      try {
        const scenarioToRun = await getScenarioById(message.payload.scenarioId);
        if (scenarioToRun) {
          console.log('Found scenario to run:', scenarioToRun.name);
          // The runner will now handle sending its own status updates
          await runScenario(scenarioToRun, sender.tab?.id);
          sendResponse({ status: 'run_initiated' }); // Acknowledge the start
        } else {
          console.error('Scenario not found:', message.payload.scenarioId);
          sendResponse({ status: 'error', message: 'Scenario not found' });
        }
      } catch (error) {
        console.error('Error initiating scenario run:', error);
        sendResponse({ status: 'error', message: (error as Error).message });
      }
    })();
    return true;
  }

  if (message.type === 'START_RECORDING') {
    (async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id && tab.url) {
            const newScenario: Scenario = {
              scenarioId: `rec_${Date.now()}`,
              name: `Recording from ${new URL(tab.url).hostname}`,
              createdAt: new Date().toISOString(),
              blocks: [{
                id: `blk_${Date.now()}`,
                type: 'goToURL',
                url: tab.url,
              }],
            };
            await saveScenario(newScenario);
            await chrome.storage.local.set({ 
              [STORAGE_KEYS.ACTIVE_RECORDING_SCENARIO_ID]: newScenario.scenarioId,
              [STORAGE_KEYS.RECORDING_TAB_ID]: tab.id
            });
            await chrome.tabs.sendMessage(tab.id, { type: 'ACTIVATE_RECORDER' });
            sendResponse({status: 'recording_started'});
        } else {
            console.error('No active tab with a URL found to start recording.');
            sendResponse({status: 'error', message: 'No active tab with a URL found.'});
        }
    })();
    return true;
  }
  
  if (message.type === 'STOP_RECORDING') {
    (async () => {
      const result = await chrome.storage.local.get(STORAGE_KEYS.RECORDING_TAB_ID);
      const tabId = result[STORAGE_KEYS.RECORDING_TAB_ID];
      if (tabId) {
        try {
          await chrome.tabs.sendMessage(tabId, { type: 'DEACTIVATE_RECORDER' });
        } catch (e) {
            console.warn(`Could not contact tab ${tabId} to deactivate recorder. It might have been closed.`);
        }
      }
      await chrome.storage.local.remove([
          STORAGE_KEYS.ACTIVE_RECORDING_SCENARIO_ID, 
          STORAGE_KEYS.RECORDING_TAB_ID
      ]);
      sendResponse({ status: 'recording_stopped' });
    })();
    return true;
  }

  if (message.type === 'ACTION_RECORDED') {
      (async () => {
        const result = await chrome.storage.local.get(STORAGE_KEYS.ACTIVE_RECORDING_SCENARIO_ID);
        const activeScenarioId = result[STORAGE_KEYS.ACTIVE_RECORDING_SCENARIO_ID];

        if (!activeScenarioId) {
          console.warn('Action received but no active recording session.');
          return;
        }

        const scenario = await getScenarioById(activeScenarioId);
        if (scenario) {
          const newBlock: Block = {
            ...message.payload.block,
            id: `blk_${Date.now()}`
          };
          scenario.blocks.push(newBlock);
          await saveScenario(scenario);
          sendResponse({ status: 'action_saved' });
        }
      })();
      return true;
  }
  
  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Sisypi extension installed.');
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    const result = await chrome.storage.local.get(STORAGE_KEYS.RECORDING_TAB_ID);
    if (result[STORAGE_KEYS.RECORDING_TAB_ID] === tabId) {
        console.log('Recorded tab closed. Stopping recording.');
        await chrome.storage.local.remove([
            STORAGE_KEYS.ACTIVE_RECORDING_SCENARIO_ID, 
            STORAGE_KEYS.RECORDING_TAB_ID
        ]);
    }
});
