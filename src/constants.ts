import { StepType } from './types';

// Application constants
export const APP_CONFIG = {
  NAME: 'Sisypi - Automation Assistant',
  VERSION: '2.0.0',
  POPUP_WIDTH: 450,
  POPUP_MIN_HEIGHT: 300,
  POPUP_MAX_HEIGHT: 580,
  ELEMENT_SELECTION_TIMEOUT: 10000,
  DEFAULT_WAIT_DURATION: 1000,
  MAX_SCENARIO_NAME_LENGTH: 100,
  MAX_STEPS_PER_SCENARIO: 100,
} as const;

// UI Text constants
export const UI_TEXT = {
  // Main view
  MAIN_TITLE: 'Automation Scenarios',
  CREATE_NEW_SCENARIO: 'Create New Scenario',
  NO_SCENARIOS: 'No scenarios created yet',
  NO_SCENARIOS_DESCRIPTION: 'Create your first automation scenario to get started',
  BACKUP_ALL: 'Backup All',
  LOAD_FROM_BACKUP: 'Load from Backup',
  
  // Editor view
  EDITOR_TITLE: 'Scenario Editor',
  SCENARIO_NAME: 'Scenario Name',
  SCENARIO_NAME_PLACEHOLDER: 'Enter scenario name...',
  URL_RESTRICTION: 'URL Restriction (Optional)',
  URL_RESTRICTION_PLACEHOLDER: 'e.g., google.com or example.com/path',
  URL_RESTRICTION_HELP: 'Scenario will only run on pages matching this URL pattern',
  
  // Steps
  STEPS_TITLE: 'Automation Steps',
  NO_STEPS: 'No steps added yet',
  ADD_STEP_BY_ELEMENT: 'Add Step by Selecting Element',
  TOOLBOX: 'Toolbox',
  
  // Buttons
  SAVE: 'Save',
  CANCEL: 'Cancel',
  RUN: 'Run',
  EDIT: 'Edit',
  DELETE: 'Delete',
  BACK: 'Back',
  SELECT: 'Select',
  CLOSE: 'Close',
  
  // Step actions
  CLICK: 'Click',
  TYPE: 'Type',
  COPY: 'Copy',
  WAIT: 'Wait',
  COMMENT: 'Comment',
  SCREENSHOT: 'Screenshot',
  SCROLL: 'Scroll Page',
  IF: 'IF',
  ELSE: 'ELSE',
  END_IF: 'END IF',
  LOOP: 'LOOP',
  END_LOOP: 'END LOOP',
  
  // Status messages
  STATUS_RUNNING: 'Scenario is running...',
  STATUS_SUCCESS: 'Scenario completed successfully',
  STATUS_ERROR: 'Error occurred',
  STATUS_STOPPED: 'Scenario stopped',
  
  // Error messages
  ERROR_GENERIC: 'An error occurred at step {step}: {message}',
  ERROR_ELEMENT_NOT_FOUND: 'Element not found: {selector}',
  ERROR_URL_MISMATCH: 'Current page URL does not match restriction: {restriction}',
  ERROR_SCENARIO_NOT_FOUND: 'Scenario not found',
  ERROR_INVALID_SELECTOR: 'Invalid CSS selector: {selector}',
  ERROR_COMMUNICATION: 'Communication error with page. Please refresh and try again.',
  ERROR_SCRIPT_INJECTION: 'Failed to inject script: {message}',
  
  // Selection mode
  SELECTION_TITLE: 'Element Selection Mode',
  SELECTION_INSTRUCTION: 'Hover over elements to see numbered boxes, then enter the number below:',
  SELECTION_NUMBER_PLACEHOLDER: 'Enter element number...',
  SELECTION_ERROR_INVALID: 'Please enter a valid element number',
  SELECTION_ERROR_NOT_FOUND: 'Element with number {number} not found',
  
  // Modal titles
  MODAL_CONFIGURE_ACTION: 'Configure Action',
  MODAL_EDIT_STEP: 'Edit Step',
  MODAL_CONFIRM_DELETE: 'Confirm Delete',
  
  // Form labels
  LABEL_ACTION: 'Action',
  LABEL_TEXT_TO_TYPE: 'Text to Type',
  LABEL_VARIABLE_NAME: 'Variable Name',
  LABEL_DURATION_MS: 'Duration (ms)',
  LABEL_REPETITIONS: 'Repetitions',
  LABEL_SELECTOR: 'CSS Selector',
  LABEL_COMMENT_TEXT: 'Comment',
  
  // Tooltips
  TOOLTIP_MOVE_UP: 'Move step up',
  TOOLTIP_MOVE_DOWN: 'Move step down',
  TOOLTIP_EDIT_STEP: 'Edit step',
  TOOLTIP_DELETE_STEP: 'Delete step',
  TOOLTIP_RUN_SCENARIO: 'Run this scenario',
  TOOLTIP_BACKUP: 'Download all scenarios as JSON file',
  TOOLTIP_RESTORE: 'Upload scenarios from JSON file',
} as const;

// Step type configurations
export const STEP_CONFIGS: Record<StepType, {
  icon: string;
  color: string;
  hasSelector: boolean;
  hasText: boolean;
  hasVariable: boolean;
  hasDuration: boolean;
  hasRepetitions: boolean;
  isControlFlow: boolean;
}> = {
  click: {
    icon: 'fa-solid fa-hand-pointer',
    color: 'var(--primary-color)',
    hasSelector: true,
    hasText: false,
    hasVariable: false,
    hasDuration: false,
    hasRepetitions: false,
    isControlFlow: false,
  },
  type: {
    icon: 'fa-solid fa-keyboard',
    color: 'var(--primary-color)',
    hasSelector: true,
    hasText: true,
    hasVariable: false,
    hasDuration: false,
    hasRepetitions: false,
    isControlFlow: false,
  },
  copy: {
    icon: 'fa-solid fa-copy',
    color: 'var(--primary-color)',
    hasSelector: true,
    hasText: false,
    hasVariable: true,
    hasDuration: false,
    hasRepetitions: false,
    isControlFlow: false,
  },
  wait: {
    icon: 'fa-solid fa-clock',
    color: '#faad14',
    hasSelector: false,
    hasText: false,
    hasVariable: false,
    hasDuration: true,
    hasRepetitions: false,
    isControlFlow: false,
  },
  comment: {
    icon: 'fa-solid fa-comment-dots',
    color: 'var(--comment-color)',
    hasSelector: false,
    hasText: true,
    hasVariable: false,
    hasDuration: false,
    hasRepetitions: false,
    isControlFlow: false,
  },
  screenshot: {
    icon: 'fa-solid fa-camera',
    color: '#722ed1',
    hasSelector: false,
    hasText: false,
    hasVariable: false,
    hasDuration: false,
    hasRepetitions: false,
    isControlFlow: false,
  },
  scroll: {
    icon: 'fa-solid fa-arrows-down-to-line',
    color: '#722ed1',
    hasSelector: false,
    hasText: false,
    hasVariable: false,
    hasDuration: false,
    hasRepetitions: false,
    isControlFlow: false,
  },
  if_start: {
    icon: 'fa-solid fa-question',
    color: 'var(--block-color)',
    hasSelector: true,
    hasText: false,
    hasVariable: false,
    hasDuration: false,
    hasRepetitions: false,
    isControlFlow: true,
  },
  else_block: {
    icon: 'fa-solid fa-arrows-split-up-and-left',
    color: 'var(--block-color)',
    hasSelector: false,
    hasText: false,
    hasVariable: false,
    hasDuration: false,
    hasRepetitions: false,
    isControlFlow: true,
  },
  if_end: {
    icon: 'fa-solid fa-check-double',
    color: 'var(--block-color)',
    hasSelector: false,
    hasText: false,
    hasVariable: false,
    hasDuration: false,
    hasRepetitions: false,
    isControlFlow: true,
  },
  loop_start: {
    icon: 'fa-solid fa-repeat',
    color: 'var(--block-color)',
    hasSelector: false,
    hasText: false,
    hasVariable: false,
    hasDuration: false,
    hasRepetitions: true,
    isControlFlow: true,
  },
  loop_end: {
    icon: 'fa-solid fa-circle-stop',
    color: 'var(--block-color)',
    hasSelector: false,
    hasText: false,
    hasVariable: false,
    hasDuration: false,
    hasRepetitions: false,
    isControlFlow: true,
  },
};

// CSS selectors for element selection
export const SELECTABLE_ELEMENTS_QUERY = [
  'a',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="button"]',
  '[onclick]',
  '[data-testid]',
  '.btn',
  '.button',
].join(', ');

// Storage keys
export const STORAGE_KEYS = {
  SCENARIOS: 'scenarios',
  APP_STATE: 'appState',
} as const;

// Default values
export const DEFAULTS = {
  SCENARIO: {
    title: 'New Scenario',
    urlRestriction: '',
    steps: [],
    isActive: true,
  },
  APP_STATE: {
    currentView: 'main' as const,
    activeScenarioId: null,
    language: 'en' as const,
  },
  STEP: {
    duration: 1000,
    repetitions: 1,
  },
} as const;