// Executes recorded blocks step by step

async function waitForTab(tabId) {
  return new Promise((resolve) => {
    function listener(id, info, tab) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function runScenarioSteps(tabId, steps) {
  for (const step of steps) {
    if (step.type === 'wait') {
      await new Promise((r) => setTimeout(r, step.ms));
      continue;
    }

    if (step.type === 'navigate') {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (url) => { window.location.href = url; },
        args: [step.url],
      });
      await waitForTab(tabId);
      continue;
    }

    if (step.type === 'click') {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (selector) => {
          document.querySelector(selector)?.click();
        },
        args: [step.selector],
      });
      continue;
    }

    if (step.type === 'input') {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (selector, value) => {
          const el = document.querySelector(selector);
          if (el) {
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        },
        args: [step.selector, step.value],
      });
      continue;
    }

    if (step.type === 'copy') {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (selector) => {
          const el = document.querySelector(selector);
          if (el) {
            const text = el.textContent || el.value || '';
            navigator.clipboard.writeText(text);
          }
        },
        args: [step.selector],
      });
      continue;
    }

    // small delay between steps
    await new Promise((r) => setTimeout(r, 300));
  }
}

self.runScenarioSteps = runScenarioSteps;
