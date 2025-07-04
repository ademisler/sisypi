import { startRecording, stopRecording } from './recorder';

console.log('Sisypi Content Script Loaded.');

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'ACTIVATE_RECORDER':
      console.log('Recorder activated by background script.');
      startRecording();
      sendResponse({ status: 'recording_started' });
      break;
    case 'DEACTIVATE_RECORDER':
      console.log('Recorder deactivated by background script.');
      stopRecording();
      sendResponse({ status: 'recording_stopped' });
      break;
  }
  return true;
});
