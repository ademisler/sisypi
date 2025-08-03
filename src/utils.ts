import { AutomationStep, StatusMessage } from './types';
import { STEP_CONFIGS, UI_TEXT } from './constants';

/**
 * Generates a unique ID for scenarios and other entities
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validates if a string is a valid CSS selector
 */
export const isValidSelector = (selector: string): boolean => {
  if (!selector || selector.trim() === '') return false;
  
  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitizes user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Interpolates variables in text using {{variableName}} syntax
 */
export const interpolateVariables = (text: string, variables: Record<string, string>): string => {
  if (!text) return '';
  
  return text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
    return variables[variableName] || match;
  });
};

/**
 * Validates a step configuration
 */
export const validateStep = (step: AutomationStep): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const config = STEP_CONFIGS[step.type];
  
  if (!config) {
    errors.push(`Unknown step type: ${step.type}`);
    return { isValid: false, errors };
  }
  
  if (config.hasSelector && (!step.selector || step.selector.trim() === '')) {
    errors.push('Selector is required for this step type');
  }
  
  if (config.hasSelector && step.selector && !isValidSelector(step.selector)) {
    errors.push('Invalid CSS selector');
  }
  
  if (config.hasText && (!step.text || step.text.trim() === '')) {
    errors.push('Text is required for this step type');
  }
  
  if (config.hasVariable && (!step.variable || step.variable.trim() === '')) {
    errors.push('Variable name is required for this step type');
  }
  
  if (config.hasDuration && (!step.duration || Number(step.duration) <= 0)) {
    errors.push('Duration must be a positive number');
  }
  
  if (config.hasRepetitions && (!step.repetitions || Number(step.repetitions) <= 0)) {
    errors.push('Repetitions must be a positive number');
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Gets display information for a step (returns data for React components to render)
 */
export const getStepDisplayInfo = (step: AutomationStep) => {
  const config = STEP_CONFIGS[step.type];
  if (!config) {
    return {
      icon: 'fa-solid fa-question-circle',
      text: 'Unknown Step',
      color: 'var(--danger-color)',
      selector: '',
      variable: '',
      hasSelector: false,
      hasVariable: false,
    };
  }
  
  let text = '';
  
  switch (step.type) {
    case 'click':
      text = `${UI_TEXT.CLICK}: ${step.selector || ''}`;
      break;
    case 'type':
      text = `${UI_TEXT.TYPE} "${step.text || ''}" into ${step.selector || ''}`;
      break;
    case 'copy':
      text = `Copy from: ${step.selector || ''}`;
      break;
    case 'wait':
      text = `${UI_TEXT.WAIT}: ${step.duration || 1000}ms`;
      break;
    case 'comment':
      text = step.text || '...';
      break;
    case 'screenshot':
      text = UI_TEXT.SCREENSHOT;
      break;
    case 'scroll':
      text = UI_TEXT.SCROLL;
      break;
    case 'if_start':
      text = `${UI_TEXT.IF} ${step.selector || ''} exists`;
      break;
    case 'else_block':
      text = UI_TEXT.ELSE;
      break;
    case 'if_end':
      text = UI_TEXT.END_IF;
      break;
    case 'loop_start':
      text = `${UI_TEXT.LOOP} ${step.repetitions || 'N'} times`;
      break;
    case 'loop_end':
      text = UI_TEXT.END_LOOP;
      break;
    default:
      text = 'Unknown Step';
  }
  
  return {
    icon: config.icon,
    text,
    color: config.color,
    selector: step.selector || '',
    variable: step.variable || '',
    hasSelector: !!step.selector,
    hasVariable: !!step.variable,
  };
};

/**
 * Formats status messages with parameter interpolation
 */
export const formatStatusMessage = (message: StatusMessage): string => {
  let text = message.messageKey;
  
  // Map message keys to UI text
  const messageMap: Record<string, string> = {
    durumCalisiyor: UI_TEXT.STATUS_RUNNING,
    durumBasarili: UI_TEXT.STATUS_SUCCESS,
    hataGenel: UI_TEXT.ERROR_GENERIC,
    hataElementBulunamadi: UI_TEXT.ERROR_ELEMENT_NOT_FOUND,
    hataUrlUyusmuyor: UI_TEXT.ERROR_URL_MISMATCH,
  };
  
  text = messageMap[message.messageKey] || message.messageKey;
  
  // Interpolate parameters
  if (message.params) {
    Object.entries(message.params).forEach(([key, value]) => {
      text = text.replace(`{${key}}`, String(value));
    });
  }
  
  return text;
};

/**
 * Debounces a function call
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttles a function call
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Deep clones an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

/**
 * Checks if an element is visible in the viewport
 */
export const isElementVisible = (element: Element): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
};

/**
 * Waits for a specified duration
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Waits for an element to appear in the DOM
 */
export const waitForElement = (
  selector: string,
  timeout: number = 5000
): Promise<Element> => {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
};

/**
 * Downloads data as a JSON file
 */
export const downloadJSON = (data: any, filename: string): void => {
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Reads a JSON file from user input
 */
export const readJSONFile = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };
    
    input.click();
  });
};