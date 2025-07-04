export type BlockType = 
  | 'goToURL'
  | 'typeText'
  | 'clickElement'
  | 'waitForElement'
  | 'copyText'
  | 'openTab'
  | 'wait'
  | 'scroll'
  | 'closeTab'
  | 'ifElementExists'
  | 'loop';

export interface Block {
  id: string;
  type: BlockType;
  delayAfter?: number;

  // Block-specific properties
  url?: string;
  selector?: string;
  value?: string;
  isSecret?: boolean;
  saveAsVariable?: string;
  duration?: number; // for 'wait' block
  timeout?: number; // for 'waitForElement' block
  
  // scroll
  scrollX?: number; // 0 for vertical
  scrollY?: number; // 0 for horizontal

  // ifElementExists
  ifBlocks?: Block[];
  elseBlocks?: Block[];

  // loop
  count?: number;
  loopBlocks?: Block[];
}

export interface Scenario {
  scenarioId: string;
  name: string;
  createdAt: string; // ISO Date String
  blocks: Block[];
}

export type BlockStatus = 'idle' | 'running' | 'success' | 'error';

export interface BlockWithStatus extends Block {
    status: BlockStatus;
    error?: string;
}
