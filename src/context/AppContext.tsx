import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type {
  Scenario,
  ScenarioCollection,
  ViewType,
  StatusMessage,
  AppState as AppStateType,
} from '../types';
import { DEFAULTS, STORAGE_KEYS } from '../constants';
import { generateId, formatStatusMessage, debounce } from '../utils';

// === STATE TYPES ===
interface AppState {
  scenarios: ScenarioCollection;
  currentView: ViewType;
  activeScenarioId: string | null;
  status: { message: string; type: string };
  isLoading: boolean;
  error: string | null;
}

// === ACTION TYPES ===
type AppAction =
  | { type: 'SET_SCENARIOS'; payload: ScenarioCollection }
  | { type: 'ADD_SCENARIO'; payload: Scenario }
  | { type: 'UPDATE_SCENARIO'; payload: Scenario }
  | { type: 'DELETE_SCENARIO'; payload: string }
  | { type: 'SET_VIEW'; payload: ViewType }
  | { type: 'SET_ACTIVE_SCENARIO'; payload: string | null }
  | { type: 'SET_STATUS'; payload: { message: string; type: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_STATUS' };

// === CONTEXT INTERFACE ===
interface AppContextType {
  state: AppState;
  actions: {
    createScenario: () => void;
    updateScenario: (scenario: Scenario) => void;
    deleteScenario: (scenarioId: string) => void;
    setActiveScenario: (scenarioId: string | null) => void;
    setView: (view: ViewType) => void;
    runScenario: (scenarioId: string) => void;
    backupScenarios: () => void;
    restoreScenarios: (scenarios: ScenarioCollection) => void;
    setStatus: (message: string, type: string) => void;
    clearStatus: () => void;
    setError: (error: string | null) => void;
  };
}

// === INITIAL STATE ===
const initialState: AppState = {
  scenarios: {},
  currentView: 'main',
  activeScenarioId: null,
  status: { message: '', type: '' },
  isLoading: false,
  error: null,
};

// === REDUCER ===
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_SCENARIOS':
      return { ...state, scenarios: action.payload };
    
    case 'ADD_SCENARIO':
      return {
        ...state,
        scenarios: { ...state.scenarios, [action.payload.id]: action.payload },
      };
    
    case 'UPDATE_SCENARIO':
      return {
        ...state,
        scenarios: { ...state.scenarios, [action.payload.id]: action.payload },
      };
    
    case 'DELETE_SCENARIO': {
      const { [action.payload]: deleted, ...remaining } = state.scenarios;
      return {
        ...state,
        scenarios: remaining,
        activeScenarioId: state.activeScenarioId === action.payload ? null : state.activeScenarioId,
      };
    }
    
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    
    case 'SET_ACTIVE_SCENARIO':
      return { ...state, activeScenarioId: action.payload };
    
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_STATUS':
      return { ...state, status: { message: '', type: '' } };
    
    default:
      return state;
  }
};

// === CONTEXT CREATION ===
const AppContext = createContext<AppContextType | undefined>(undefined);

// === CONTEXT PROVIDER ===
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // === CHROME EXTENSION API HELPERS ===
  const sendChromeMessage = useCallback((message: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }, []);

  // === DEBOUNCED SAVE FUNCTION ===
  const debouncedSave = useCallback(
    debounce(async (scenarios: ScenarioCollection) => {
      try {
        await sendChromeMessage({
          action: 'saveScenarios',
          scenarios,
        });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: `Failed to save scenarios: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }, 500),
    [sendChromeMessage]
  );

  // === LOAD INITIAL DATA ===
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const response = await sendChromeMessage({ action: 'getInitialData' });
        
        if (response?.scenarios) {
          dispatch({ type: 'SET_SCENARIOS', payload: response.scenarios });
        }
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: `Failed to load scenarios: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadInitialData();

    // === LISTEN FOR STATUS UPDATES ===
    const messageListener = (message: any) => {
      if (message.action === 'updateRunStatus') {
        const statusText = formatStatusMessage(message.status);
        dispatch({
          type: 'SET_STATUS',
          payload: {
            message: statusText,
            type: message.status.type,
          },
        });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, [sendChromeMessage]);

  // === SAVE SCENARIOS WHEN THEY CHANGE ===
  useEffect(() => {
    if (Object.keys(state.scenarios).length > 0) {
      debouncedSave(state.scenarios);
    }
  }, [state.scenarios, debouncedSave]);

  // === ACTIONS ===
  const actions = {
    createScenario: useCallback(() => {
      const newId = generateId();
      const newScenario: Scenario = {
        id: newId,
        title: DEFAULTS.SCENARIO.title,
        urlRestriction: DEFAULTS.SCENARIO.urlRestriction,
        steps: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
      };

      dispatch({ type: 'ADD_SCENARIO', payload: newScenario });
      dispatch({ type: 'SET_ACTIVE_SCENARIO', payload: newId });
      dispatch({ type: 'SET_VIEW', payload: 'editor' });
    }, []),

    updateScenario: useCallback((scenario: Scenario) => {
      const updatedScenario = {
        ...scenario,
        updatedAt: Date.now(),
      };
      dispatch({ type: 'UPDATE_SCENARIO', payload: updatedScenario });
    }, []),

    deleteScenario: useCallback((scenarioId: string) => {
      dispatch({ type: 'DELETE_SCENARIO', payload: scenarioId });
    }, []),

    setActiveScenario: useCallback((scenarioId: string | null) => {
      dispatch({ type: 'SET_ACTIVE_SCENARIO', payload: scenarioId });
    }, []),

    setView: useCallback((view: ViewType) => {
      dispatch({ type: 'SET_VIEW', payload: view });
    }, []),

    runScenario: useCallback(async (scenarioId: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_STATUS' });

        await sendChromeMessage({
          action: 'runScenario',
          scenarioId,
          allScenarios: state.scenarios,
        });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: `Failed to run scenario: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      } finally {
        setTimeout(() => {
          dispatch({ type: 'SET_LOADING', payload: false });
        }, 1000);
      }
    }, [state.scenarios, sendChromeMessage]),

    backupScenarios: useCallback(async () => {
      try {
        await sendChromeMessage({ action: 'backupAll' });
        dispatch({
          type: 'SET_STATUS',
          payload: { message: 'Backup downloaded successfully', type: 'success' },
        });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: `Failed to backup scenarios: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }, [sendChromeMessage]),

    restoreScenarios: useCallback(async (scenarios: ScenarioCollection) => {
      try {
        const response = await sendChromeMessage({
          action: 'restoreFromBackup',
          data: scenarios,
        });

        if (response?.success) {
          dispatch({ type: 'SET_SCENARIOS', payload: scenarios });
          dispatch({
            type: 'SET_STATUS',
            payload: { message: 'Scenarios restored successfully', type: 'success' },
          });
        } else {
          throw new Error('Failed to restore scenarios');
        }
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: `Failed to restore scenarios: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }, [sendChromeMessage]),

    setStatus: useCallback((message: string, type: string) => {
      dispatch({ type: 'SET_STATUS', payload: { message, type } });
    }, []),

    clearStatus: useCallback(() => {
      dispatch({ type: 'CLEAR_STATUS' });
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// === CUSTOM HOOK ===
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};