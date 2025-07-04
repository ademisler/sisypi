import type { Block } from '../popup/types';
import { getUniqueSelector } from './selectorGenerator';

let inputDebounceTimer: number | undefined;

function sendAction(block: Omit<Block, 'id'>) {
    console.log('Action recorded:', block);
    chrome.runtime.sendMessage({ type: 'ACTION_RECORDED', payload: { block } });
}

const handleClick = (event: MouseEvent) => {
  if ((event.target as HTMLElement).closest('.sisypi-ignore')) return;
  
  const target = event.target as HTMLElement;
  sendAction({
    type: 'clickElement',
    selector: getUniqueSelector(target)
  });
};

const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (target.type === 'password' || !target.value) return;

    // Debounce logic
    clearTimeout(inputDebounceTimer);
    inputDebounceTimer = window.setTimeout(() => {
        sendAction({
            type: 'typeText',
            selector: getUniqueSelector(target),
            value: target.value
        });
    }, 500); // Wait for 500ms of inactivity before recording
};


export function startRecording() {
  stopRecording(); // Ensure no duplicate listeners
  document.addEventListener('click', handleClick, { capture: true });
  document.addEventListener('input', handleInput, { capture: true });
  
  // Visual indicator
  document.body.style.border = '3px solid #e63946';
  document.body.style.boxSizing = 'border-box';
}

export function stopRecording() {
  document.removeEventListener('click', handleClick, { capture: true });
  document.removeEventListener('input', handleInput, { capture: true });
  clearTimeout(inputDebounceTimer);
  
  // Remove visual indicator
  document.body.style.border = 'none';
}