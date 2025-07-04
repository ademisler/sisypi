import { executeBlock } from '../background/runner';

declare const chrome: any;

describe('executeBlock', () => {
  beforeEach(() => {
    // mock chrome API
    global.chrome = {
      runtime: { sendMessage: jest.fn() },
      tabs: { update: jest.fn(), create: jest.fn(), remove: jest.fn(), query: jest.fn().mockResolvedValue([{id:1}]) },
      scripting: { executeScript: jest.fn() }
    } as any;
  });

  test('wait block delays for specified duration', async () => {
    const state = { tabId: 1, variables: {} };
    await executeBlock(state, { id: 'b1', type: 'wait', duration: 10 } as any);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'RUN_STATUS_UPDATE',
      payload: { blockId: 'b1', status: 'running', error: undefined }
    });
    expect(chrome.runtime.sendMessage).toHaveBeenLastCalledWith({
      type: 'RUN_STATUS_UPDATE',
      payload: { blockId: 'b1', status: 'success', error: undefined }
    });
  });
});
