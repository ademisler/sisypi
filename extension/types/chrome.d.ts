// This file provides minimal type definitions for the Chrome Extension API
// to satisfy the TypeScript compiler. This is necessary because the project
// seems to be missing a direct dependency on @types/chrome.

declare namespace chrome {
  // Common types
  interface Tab {
    id?: number;
    url?: string;
    // other properties can be added as needed
  }

  // chrome.runtime
  namespace runtime {
    interface MessageSender {
      tab?: Tab;
      id?: string;
      url?: string;
      tlsChannelId?: string;
    }

    const onMessage: {
      addListener(
        callback: (
          message: any,
          sender: MessageSender,
          sendResponse: (response?: any) => void
        ) => boolean | void | Promise<any>
      ): void;
      removeListener(
        callback: (
          message: any,
          sender: MessageSender,
          sendResponse: (response?: any) => void
        ) => boolean | void | Promise<any>
      ): void;
    };

    const onInstalled: {
      addListener(callback: (details: { reason: string }) => void): void;
    };

    function sendMessage(message: any): Promise<any>;
    function sendMessage(extensionId: string, message: any): Promise<any>;
  }

  // chrome.storage
  namespace storage {
    interface StorageChange {
      oldValue?: any;
      newValue?: any;
    }
    interface StorageArea {
      get(keys?: string | string[] | null): Promise<{ [key: string]: any }>;
      set(items: { [key: string]: any }): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
    }
    const local: StorageArea;
    const onChanged: {
      addListener(
        callback: (
          changes: { [key: string]: StorageChange },
          areaName: string
        ) => void
      ): void;
      removeListener(
        callback: (
          changes: { [key: string]: StorageChange },
          areaName: string
        ) => void
      ): void;
    };
  }

  // chrome.i18n
  namespace i18n {
    function getMessage(
      messageName: string,
      substitutions?: string | string[]
    ): string;
  }

  // chrome.tabs
  namespace tabs {
    function query(queryInfo: {
      active?: boolean;
      currentWindow?: boolean;
    }): Promise<Tab[]>;

    function update(
      tabId: number,
      updateProperties: { url?: string }
    ): Promise<Tab | undefined>;
    
    function create(createProperties: {
      url?: string;
      active?: boolean;
    }): Promise<Tab>;

    function remove(tabId: number): Promise<void>;

    function sendMessage(tabId: number, message: any, options?: object): Promise<any>;

    const onRemoved: {
      addListener(
        callback: (
          tabId: number,
          removeInfo: { windowId: number; isWindowClosing: boolean }
        ) => void
      ): void;
    };
  }

  // chrome.scripting
  namespace scripting {
    interface InjectionTarget {
        tabId: number;
    }
    interface ScriptInjection<T extends any[], U> {
        target: InjectionTarget;
        func: (...args: T) => U;
        args?: T;
    }
    interface InjectionResult<T = any> {
      result: T;
    }
    function executeScript<T extends any[], U>(injection: ScriptInjection<T, U>): Promise<InjectionResult<Awaited<U>>[]>;
  }
}