import type { Scenario, Block, BlockWithStatus } from '../popup/types';

interface RunnerState {
  tabId: number;
  variables: Record<string, string>;
}

// Simple delay function
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function substituteVariables(text: string, variables: Record<string, string>): string {
    return text.replace(/{{\s*(\w+)\s*}}/g, (match, varName) => {
        return variables[varName] || match;
    });
}

async function sendStatusUpdate(block: Block, status: BlockWithStatus['status'], error?: string) {
    chrome.runtime.sendMessage({
        type: 'RUN_STATUS_UPDATE',
        payload: { blockId: block.id, status, error }
    });
}

async function executeBlock(state: RunnerState, block: Block): Promise<RunnerState> {
  console.log(`Executing block: ${block.type} on tab ${state.tabId}`);
  await sendStatusUpdate(block, 'running');
  
  try {
    const blockValue = block.value ? substituteVariables(block.value, state.variables) : undefined;
    const blockUrl = block.url ? substituteVariables(block.url, state.variables) : undefined;

    switch (block.type) {
        case 'goToURL':
            if (blockUrl) await chrome.tabs.update(state.tabId, { url: blockUrl });
            break;

        case 'openTab':
            if (blockUrl) {
                const newTab = await chrome.tabs.create({ url: blockUrl, active: true });
                state.tabId = newTab.id!;
            }
            break;
        
        case 'closeTab':
            await chrome.tabs.remove(state.tabId);
            // After closing, we lose the active tab context. This is a potential state issue.
            // For now, we assume the user will handle this.
            break;

        case 'clickElement':
            if (block.selector) {
                await chrome.scripting.executeScript({
                    target: { tabId: state.tabId },
                    func: (selector: string) => (document.querySelector(selector) as HTMLElement)?.click(),
                    args: [block.selector],
                });
            }
            break;
        
        case 'typeText':
            if (block.selector && blockValue !== undefined) {
                await chrome.scripting.executeScript({
                    target: { tabId: state.tabId },
                    func: (selector: string, value: string) => {
                        const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
                        if (el) el.value = value;
                    },
                    args: [block.selector, blockValue],
                });
            }
            break;
            
        case 'wait':
            if (block.duration) await delay(block.duration);
            break;

        case 'waitForElement':
            if (block.selector) {
                const [result] = await chrome.scripting.executeScript({
                    target: { tabId: state.tabId },
                    func: (selector: string, timeout: number) => new Promise((resolve, reject) => {
                        const startTime = Date.now();
                        const interval = setInterval(() => {
                            if (document.querySelector(selector)) {
                                clearInterval(interval);
                                resolve(true);
                            } else if (Date.now() - startTime > timeout) {
                                clearInterval(interval);
                                reject(new Error(`Element "${selector}" not found within ${timeout}ms.`));
                            }
                        }, 100);
                    }),
                    args: [block.selector, block.timeout || 10000],
                });
                if (result?.result !== true) {
                    throw new Error(`waitForElement failed for selector: ${block.selector}`);
                }
            }
            break;
            
        case 'copyText':
            if (block.selector && block.saveAsVariable) {
                const variableName = block.saveAsVariable;
                const [result] = await chrome.scripting.executeScript({
                    target: { tabId: state.tabId },
                    func: (selector: string) => (document.querySelector(selector) as HTMLElement)?.innerText,
                    args: [block.selector],
                });

                if (typeof result?.result === 'string') {
                    state.variables[variableName] = result.result;
                    console.log(`Saved text to variable {{${variableName}}}: "${result.result}"`);
                }
            }
            break;
        
        case 'scroll':
            await chrome.scripting.executeScript({
                target: { tabId: state.tabId },
                func: (x: number, y: number) => window.scrollBy(x, y),
                args: [block.scrollX || 0, block.scrollY || 0],
            });
            break;
        
        case 'ifElementExists':
            if (block.selector) {
                const [result] = await chrome.scripting.executeScript({
                    target: { tabId: state.tabId },
                    func: (selector) => !!document.querySelector(selector),
                    args: [block.selector]
                });
                if (result?.result && block.ifBlocks) {
                    state = await executeBlocks(state, block.ifBlocks);
                } else if (!result?.result && block.elseBlocks) {
                    state = await executeBlocks(state, block.elseBlocks);
                }
            }
            break;

        case 'loop':
            if (block.count && block.loopBlocks) {
                for (let i = 0; i < block.count; i++) {
                    state = await executeBlocks(state, block.loopBlocks);
                }
            }
            break;

        default:
            console.warn(`Unknown block type: ${(block as any).type}`);
    }

    if (block.delayAfter) {
      await delay(block.delayAfter);
    }
    
    await sendStatusUpdate(block, 'success');
  } catch (err) {
    const error = err as Error;
    console.error(`Error executing block ${block.id} (${block.type}):`, error.message);
    await sendStatusUpdate(block, 'error', error.message);
    throw error; // Propagate the error to stop the execution
  }

  return state;
}

async function executeBlocks(state: RunnerState, blocks: Block[]): Promise<RunnerState> {
    let currentState = { ...state };
    for (const block of blocks) {
        currentState = await executeBlock(currentState, block);
    }
    return currentState;
}

export const runScenario = async (scenario: Scenario, initialTabId?: number): Promise<void> => {
  let tabId = initialTabId;
  if (!tabId) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) {
          throw new Error('No active tab found to run the scenario.');
      }
      tabId = activeTab.id;
  }
  
  let state: RunnerState = {
    tabId: tabId,
    variables: {},
  };
  
  try {
    await executeBlocks(state, scenario.blocks);
    console.log(`Scenario "${scenario.name}" finished successfully.`);
    chrome.runtime.sendMessage({ type: 'RUN_FINISHED', payload: { status: 'success' } });
  } catch(e) {
    console.error(`Scenario "${scenario.name}" failed.`);
    chrome.runtime.sendMessage({ type: 'RUN_FINISHED', payload: { status: 'error', message: (e as Error).message } });
  }
};