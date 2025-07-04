// Handles popup UI logic for Sisypi

const startBtn = document.getElementById('start-recording');
const stopBtn = document.getElementById('stop-recording');
const addWaitBtn = document.getElementById('add-wait');
const addCopyBtn = document.getElementById('add-copy');
const listEl = document.getElementById('scenario-list');

let currentName = null;

startBtn.addEventListener('click', () => {
  const name = prompt('Scenario name?');
  if (!name) return;
  currentName = name;
  chrome.runtime.sendMessage({ type: 'startRecording', name });
});

stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'stopRecording' });
  currentName = null;
  setTimeout(loadList, 200);
});

addWaitBtn.addEventListener('click', () => {
  const sec = parseInt(prompt('Seconds to wait?'), 10);
  if (!isNaN(sec)) {
    chrome.runtime.sendMessage({
      type: 'recordStep',
      step: { type: 'wait', ms: sec * 1000 },
    });
  }
});

addCopyBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'addCopyStep' }, (res) => {
      if (res && res.selector) {
        chrome.runtime.sendMessage({
          type: 'recordStep',
          step: { type: 'copy', selector: res.selector },
        });
      }
    });
  });
});

function runScenario(name) {
  chrome.runtime.sendMessage({ type: 'runScenario', name });
}

function deleteScenario(name) {
  chrome.runtime.sendMessage({ type: 'stopRecording' });
  chrome.storage.local.remove(name, loadList);
}

function editScenario(name, steps) {
  const json = prompt('Edit steps as JSON', JSON.stringify(steps, null, 2));
  if (!json) return;
  try {
    const parsed = JSON.parse(json);
    saveScenario(name, parsed);
    loadList();
  } catch (e) {
    alert('Invalid JSON');
  }
}

function createItem(name, steps) {
  const li = document.createElement('li');
  li.textContent = name + ' ';
  const run = document.createElement('button');
  run.textContent = 'Run';
  run.onclick = () => runScenario(name);
  const edit = document.createElement('button');
  edit.textContent = 'Edit';
  edit.onclick = () => editScenario(name, steps);
  const del = document.createElement('button');
  del.textContent = 'Delete';
  del.onclick = () => deleteScenario(name);
  li.appendChild(run);
  li.appendChild(edit);
  li.appendChild(del);
  return li;
}

function loadList() {
  chrome.storage.local.get(null, (scenarios) => {
    listEl.innerHTML = '';
    Object.keys(scenarios).forEach((name) => {
      listEl.appendChild(createItem(name, scenarios[name]));
    });
  });
}

loadList();
