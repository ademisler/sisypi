// DOM interaction and element tracking

let recording = false;

// Lazy loaded selectors helper
function getSelector(el) {
  if (typeof getUniqueSelector === 'function') {
    return getUniqueSelector(el);
  }
  return '';
}

function sendStep(step) {
  chrome.runtime.sendMessage({ type: 'recordStep', step });
}

function handleClick(e) {
  if (!recording) return;
  const selector = getSelector(e.target);
  sendStep({ type: 'click', selector });

  if (e.target.tagName === 'A' && e.target.href) {
    sendStep({ type: 'navigate', url: e.target.href });
  }
}

function handleInput(e) {
  if (!recording) return;
  const selector = getSelector(e.target);
  sendStep({ type: 'input', selector, value: e.target.value });
}

function handleSubmit(e) {
  if (!recording) return;
  const form = e.target;
  if (form.action) {
    sendStep({ type: 'navigate', url: form.action });
  }
}

function start() {
  recording = true;
  document.addEventListener('click', handleClick, true);
  document.addEventListener('input', handleInput, true);
  document.addEventListener('submit', handleSubmit, true);
}

function stop() {
  recording = false;
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('input', handleInput, true);
  document.removeEventListener('submit', handleSubmit, true);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'startRecording') {
    start();
  } else if (msg.type === 'stopRecording') {
    stop();
  } else if (msg.type === 'addCopyStep') {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const node = sel.getRangeAt(0).startContainer.parentElement;
      sendResponse({ selector: getSelector(node) });
    } else {
      sendResponse({});
    }
  } else if (msg.type === 'getRecordingStatus') {
    sendResponse({ recording });
  }
  return true;
});
