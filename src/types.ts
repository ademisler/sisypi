// Core automation types
export interface AutomationStep {
  type: StepType;
  selector?: string;
  text?: string;
  variable?: string;
  duration?: number | string;
  repetitions?: number | string;
  elementData?: ElementData;
  // Enhanced properties
  value?: string;
  attribute?: string;
  key?: string;
  expectedText?: string;
  timeout?: number;
  retryCount?: number;
  description?: string;
}

export type StepType =
  | 'click'
  | 'type'
  | 'copy'
  | 'wait'
  | 'comment'
  | 'screenshot'
  | 'scroll'
  | 'if_start'
  | 'else_block'
  | 'if_end'
  | 'loop_start'
  | 'loop_end'
  | 'hover'
  | 'double_click'
  | 'right_click'
  | 'select_option'
  | 'check_checkbox'
  | 'uncheck_checkbox'
  | 'focus'
  | 'blur'
  | 'clear_field'
  | 'press_key'
  | 'wait_for_element'
  | 'wait_for_text'
  | 'assert_text'
  | 'assert_element'
  | 'extract_attribute'
  | 'scroll_to_element';

export interface ElementData {
  selector: string;
  tagName: string;
  attributes: Record<string, string>;
  text?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Scenario {
  id: string;
  title: string;
  urlRestriction: string;
  steps: AutomationStep[];
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export interface ScenarioCollection {
  [key: string]: Scenario;
}

// UI State types
export type ViewType = 'main' | 'editor';

export interface AppState {
  currentView: ViewType;
  activeScenarioId: string | null;
  language: 'en' | 'tr';
}

// Status and messaging types
export interface StatusMessage {
  type: 'success' | 'error' | 'warning' | 'info' | 'running';
  messageKey: string;
  params?: Record<string, string | number>;
}

export interface RuntimeMessage {
  action: string;
  [key: string]: any;
}

// Element selection types
export interface SelectionState {
  isActive: boolean;
  selectableElements: Element[];
  selectedElement: Element | null;
  overlayContainerId: string;
}

// Scenario execution types
export interface ExecutionContext {
  variables: Record<string, string>;
  isRunning: boolean;
  currentStep: number;
  controlFlowStack: ControlFlowState[];
}

export interface ControlFlowState {
  type: 'if' | 'loop';
  condition?: boolean;
  count?: number;
  start?: number;
  current?: number;
}

// Component props types
export interface StepItemProps {
  step: AutomationStep;
  index: number;
  onEdit: (step: AutomationStep, index: number) => void;
  onDelete: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export interface ModalProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  isOpen?: boolean;
}

export interface EditStepModalProps {
  stepInfo: {
    step: AutomationStep;
    index: number;
  };
  onClose: () => void;
  onSave: (step: AutomationStep, index: number) => void;
}

// Error types
export interface AutomationError extends Error {
  step?: number;
  selector?: string;
  code?: string;
}

// Storage types
export interface StorageData {
  scenarios: ScenarioCollection;
  appState: AppState;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;