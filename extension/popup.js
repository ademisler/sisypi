// Handles popup UI logic for Sisypi with improved UI
const toggleBtn = document.getElementById('toggle-recording');
const recordingStatusEl = document.getElementById('recording-status');
const newScenarioBtn = document.getElementById('new-scenario-btn');
const importBtn = document.getElementById('import-btn');
const importInput = document.getElementById('import-input');
const addWaitBtn = document.getElementById('add-wait');
const addCopyBtn = document.getElementById('add-copy');
const listEl = document.getElementById('scenario-list');

let currentName = null;
let recording = false;

function updateRecordingUI() {
  if (recording) {
    recordingStatusEl.style.display = 'block';
    toggleBtn.textContent = 'Stop Recording';
  } else {
    recordingStatusEl.style.display = 'none';
    toggleBtn.textContent = 'Start Recording';
  }
}

toggleBtn.addEventListener('click', () => {
  if (!recording) {
    const name = prompt('Scenario name?');
    if (!name) return;
    currentName = name;
    chrome.runtime.sendMessage({ type: 'startRecording', name });
    recording = true;
  } else {
    chrome.runtime.sendMessage({ type: 'stopRecording' });
    recording = false;
    currentName = null;
    setTimeout(loadList, 200);
  }
  updateRecordingUI();
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

newScenarioBtn.addEventListener('click', () => {
  const name = prompt('Scenario name?');
  if (name) {
    saveScenario(name, []);
    loadList();
  }
});

importBtn.addEventListener('click', () => importInput.click());

importInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if (obj.name && Array.isArray(obj.steps)) {
        saveScenario(obj.name, obj.steps);
        loadList();
      } else {
        alert('Invalid scenario file');
      }
    } catch (err) {
      alert('Failed to import scenario');
    }
  };
  reader.readAsText(file);
  importInput.value = '';
});

function exportScenario(name, steps) {
  const data = JSON.stringify({ name, steps }, null, 2);
  const url = 'data:text/json;charset=utf-8,' + encodeURIComponent(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name.replace(/\s+/g, '_') + '.json';
  a.click();
}

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
  li.className = 'scenario-item';
  const span = document.createElement('span');
  span.textContent = name;
  const actions = document.createElement('div');
  actions.className = 'actions';

  const run = document.createElement('button');
  run.textContent = 'Run';
  run.onclick = () => runScenario(name);
  const edit = document.createElement('button');
  edit.textContent = 'Edit';
  edit.onclick = () => editScenario(name, steps);
  const exp = document.createElement('button');
  exp.textContent = 'Export';
  exp.onclick = () => exportScenario(name, steps);
  const del = document.createElement('button');
  del.className = 'delete-btn';
  del.textContent = 'Delete';
  del.onclick = () => deleteScenario(name);

  actions.appendChild(run);
  actions.appendChild(edit);
  actions.appendChild(exp);
  actions.appendChild(del);

  li.appendChild(span);
  li.appendChild(actions);
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
updateRecordingUI();
