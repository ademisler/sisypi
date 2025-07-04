// Handles tab switching and background messaging

importScripts('storage.js', 'runner.js');

let currentRecording = null; // {name, steps}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'startRecording') {
    currentRecording = { name: msg.name, steps: [] };
    if (sender.tab) {
      chrome.tabs.sendMessage(sender.tab.id, { type: 'startRecording' });
    }
  } else if (msg.type === 'stopRecording') {
    if (sender.tab) {
      chrome.tabs.sendMessage(sender.tab.id, { type: 'stopRecording' });
    }
    if (currentRecording) {
      saveScenario(currentRecording.name, currentRecording.steps);
    }
    currentRecording = null;
  } else if (msg.type === 'recordStep') {
    if (currentRecording) {
      currentRecording.steps.push(msg.step);
    }
  } else if (msg.type === 'runScenario') {
    loadScenario(msg.name, (steps) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          runScenarioSteps(tabs[0].id, steps);
        }
      });
    });
  } else if (msg.type === 'getRecordingStatus') {
    sendResponse({ recording: !!currentRecording });
  }
  return true;
});
