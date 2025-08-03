import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './popup/popup.css';

// Import our new type system and utilities
import type {
  Scenario,
  ScenarioCollection,
  AutomationStep,
  ViewType,
  StatusMessage,
  StepType,
} from './src/types';
import { UI_TEXT, APP_CONFIG, STEP_CONFIGS, DEFAULTS } from './src/constants';
import {
  generateId,
  getStepDisplayInfo,
  formatStatusMessage,
  validateStep,
  debounce,
} from './src/utils';

// === MAIN APP COMPONENT ===
const App: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioCollection>({});
  const [view, setView] = useState<ViewType>('main');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ message: string; type: string }>({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data from background script
  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'getInitialData' }, (response) => {
      if (response?.scenarios) {
        setScenarios(response.scenarios);
      }
    });

    // Listen for status updates
    const messageListener = (message: any) => {
      if (message.action === 'updateRunStatus') {
        const statusText = formatStatusMessage(message.status);
        setStatus({
          message: statusText,
          type: message.status.type,
        });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  // Save scenarios to storage
  const saveScenarios = useCallback(
    debounce((newScenarios: ScenarioCollection) => {
      chrome.runtime.sendMessage({
        action: 'saveScenarios',
        scenarios: newScenarios,
      });
    }, 500),
    []
  );

  const handleCreateScenario = () => {
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

    const updatedScenarios = { ...scenarios, [newId]: newScenario };
    setScenarios(updatedScenarios);
    setActiveScenarioId(newId);
    setView('editor');
    saveScenarios(updatedScenarios);
  };

  const handleEditScenario = (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    setView('editor');
  };

  const handleDeleteScenario = (scenarioId: string) => {
    const { [scenarioId]: deleted, ...remaining } = scenarios;
    setScenarios(remaining);
    saveScenarios(remaining);
  };

  const handleRunScenario = (scenarioId: string) => {
    setIsLoading(true);
    chrome.runtime.sendMessage({
      action: 'runScenario',
      scenarioId,
      allScenarios: scenarios,
    });
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleBackupAll = () => {
    chrome.runtime.sendMessage({ action: 'backupAll' });
  };

  const handleLoadBackup = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            chrome.runtime.sendMessage({
              action: 'restoreFromBackup',
              data,
            }, (response) => {
              if (response?.success) {
                setScenarios(data);
                setStatus({
                  message: 'Scenarios restored successfully',
                  type: 'success',
                });
              }
            });
          } catch (error) {
            setStatus({
              message: 'Invalid backup file',
              type: 'error',
            });
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } catch (error) {
      setStatus({
        message: 'Failed to load backup file',
        type: 'error',
      });
    }
  };

  return (
    <div className="app-container">
      <Header
        view={view}
        onBack={() => setView('main')}
        onBackupAll={handleBackupAll}
        onLoadBackup={handleLoadBackup}
      />
      
      <div className="app-content">
        {status.message && (
          <StatusBar message={status.message} type={status.type} />
        )}
        
        {view === 'main' ? (
          <MainView
            scenarios={scenarios}
            onCreateScenario={handleCreateScenario}
            onEditScenario={handleEditScenario}
            onDeleteScenario={handleDeleteScenario}
            onRunScenario={handleRunScenario}
            isLoading={isLoading}
          />
        ) : (
          <EditorView
            scenario={activeScenarioId ? scenarios[activeScenarioId] : null}
            onSave={(updatedScenario) => {
              const updatedScenarios = {
                ...scenarios,
                [updatedScenario.id]: updatedScenario,
              };
              setScenarios(updatedScenarios);
              saveScenarios(updatedScenarios);
              setView('main');
            }}
            onCancel={() => setView('main')}
          />
        )}
      </div>
    </div>
  );
};

// === HEADER COMPONENT ===
interface HeaderProps {
  view: ViewType;
  onBack: () => void;
  onBackupAll: () => void;
  onLoadBackup: () => void;
}

const Header: React.FC<HeaderProps> = ({ view, onBack, onBackupAll, onLoadBackup }) => (
  <header className="app-header">
    <h1>
      {view === 'main' ? UI_TEXT.MAIN_TITLE : UI_TEXT.EDITOR_TITLE}
    </h1>
    <div className="header-actions">
      {view === 'main' ? (
        <>
          <button className="btn btn-ghost" onClick={onLoadBackup} title={UI_TEXT.TOOLTIP_RESTORE}>
            <i className="fa-solid fa-upload"></i>
          </button>
          <button className="btn btn-ghost" onClick={onBackupAll} title={UI_TEXT.TOOLTIP_BACKUP}>
            <i className="fa-solid fa-download"></i>
          </button>
        </>
      ) : (
        <button className="btn btn-ghost" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
          {UI_TEXT.BACK}
        </button>
      )}
    </div>
  </header>
);

// === STATUS BAR COMPONENT ===
interface StatusBarProps {
  message: string;
  type: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ message, type }) => {
  const getStatusClass = () => {
    switch (type) {
      case 'success':
      case 'basari':
        return 'status-success';
      case 'error':
      case 'hata':
        return 'status-error';
      case 'warning':
        return 'status-warning';
      case 'running':
      case 'calisiyor':
        return 'status-info';
      default:
        return 'status-info';
    }
  };

  const getStatusIcon = () => {
    switch (type) {
      case 'success':
      case 'basari':
        return 'fa-solid fa-check-circle';
      case 'error':
      case 'hata':
        return 'fa-solid fa-exclamation-circle';
      case 'warning':
        return 'fa-solid fa-exclamation-triangle';
      case 'running':
      case 'calisiyor':
        return 'fa-solid fa-spinner spinning';
      default:
        return 'fa-solid fa-info-circle';
    }
  };

  return (
    <div className={`status-message ${getStatusClass()}`}>
      <i className={getStatusIcon()}></i>
      {message}
    </div>
  );
};

// === MAIN VIEW COMPONENT ===
interface MainViewProps {
  scenarios: ScenarioCollection;
  onCreateScenario: () => void;
  onEditScenario: (id: string) => void;
  onDeleteScenario: (id: string) => void;
  onRunScenario: (id: string) => void;
  isLoading: boolean;
}

const MainView: React.FC<MainViewProps> = ({
  scenarios,
  onCreateScenario,
  onEditScenario,
  onDeleteScenario,
  onRunScenario,
  isLoading,
}) => {
  const scenarioList = Object.values(scenarios);

  return (
    <div className="view-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
          {UI_TEXT.MAIN_TITLE}
        </h2>
        <button className="btn btn-primary" onClick={onCreateScenario}>
          <i className="fa-solid fa-plus"></i>
          {UI_TEXT.CREATE_NEW_SCENARIO}
        </button>
      </div>

      {scenarioList.length === 0 ? (
        <EmptyState
          icon="fa-solid fa-robot"
          title={UI_TEXT.NO_SCENARIOS}
          description={UI_TEXT.NO_SCENARIOS_DESCRIPTION}
          action={
            <button className="btn btn-primary btn-lg" onClick={onCreateScenario}>
              <i className="fa-solid fa-plus"></i>
              {UI_TEXT.CREATE_NEW_SCENARIO}
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {scenarioList.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onEdit={() => onEditScenario(scenario.id)}
              onDelete={() => onDeleteScenario(scenario.id)}
              onRun={() => onRunScenario(scenario.id)}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// === SCENARIO CARD COMPONENT ===
interface ScenarioCardProps {
  scenario: Scenario;
  onEdit: () => void;
  onDelete: () => void;
  onRun: () => void;
  isLoading: boolean;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenario,
  onEdit,
  onDelete,
  onRun,
  isLoading,
}) => (
  <div className="scenario-card">
    <div className="scenario-header">
      <h3 className="scenario-title">{scenario.title}</h3>
      <div className="scenario-actions">
        <button
          className="btn btn-sm btn-primary"
          onClick={onRun}
          disabled={isLoading}
          title={UI_TEXT.TOOLTIP_RUN_SCENARIO}
        >
          <i className={`fa-solid ${isLoading ? 'fa-spinner spinning' : 'fa-play'}`}></i>
          {UI_TEXT.RUN}
        </button>
        <button className="btn btn-sm btn-ghost" onClick={onEdit} title={UI_TEXT.TOOLTIP_EDIT_STEP}>
          <i className="fa-solid fa-edit"></i>
        </button>
        <button className="btn btn-sm btn-danger" onClick={onDelete} title={UI_TEXT.TOOLTIP_DELETE_STEP}>
          <i className="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
    
    <div className="scenario-meta">
      {scenario.urlRestriction && (
        <div className="scenario-url">
          <i className="fa-solid fa-link"></i>
          <span>{scenario.urlRestriction}</span>
        </div>
      )}
      <div className="scenario-steps-count">
        <i className="fa-solid fa-list-ol"></i>
        <span>{scenario.steps.length} steps</span>
      </div>
    </div>
  </div>
);

// === EMPTY STATE COMPONENT ===
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="empty-state">
    <div className="empty-state-icon">
      <i className={icon}></i>
    </div>
    <h3 className="empty-state-title">{title}</h3>
    <p className="empty-state-description">{description}</p>
    {action && action}
  </div>
);

// === EDITOR VIEW COMPONENT ===
interface EditorViewProps {
  scenario: Scenario | null;
  onSave: (scenario: Scenario) => void;
  onCancel: () => void;
}

const EditorView: React.FC<EditorViewProps> = ({ scenario, onSave, onCancel }) => {
  const [title, setTitle] = useState(scenario?.title || DEFAULTS.SCENARIO.title);
  const [urlRestriction, setUrlRestriction] = useState(scenario?.urlRestriction || '');
  const [steps, setSteps] = useState<AutomationStep[]>(scenario?.steps || []);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedElementNumber, setSelectedElementNumber] = useState('');

  const handleSave = () => {
    if (!scenario) return;

    const updatedScenario: Scenario = {
      ...scenario,
      title: title.trim() || DEFAULTS.SCENARIO.title,
      urlRestriction: urlRestriction.trim(),
      steps,
      updatedAt: Date.now(),
    };

    onSave(updatedScenario);
  };

  const handleAddToolboxStep = (stepType: StepType) => {
    const newStep: AutomationStep = {
      type: stepType,
      ...(STEP_CONFIGS[stepType].hasDuration && { duration: DEFAULTS.STEP.duration }),
      ...(STEP_CONFIGS[stepType].hasRepetitions && { repetitions: DEFAULTS.STEP.repetitions }),
    };

    setSteps([...steps, newStep]);
  };

  const handleStartElementSelection = () => {
    setIsSelecting(true);
    chrome.runtime.sendMessage({ action: 'startSelection' });
  };

  const handleSelectElement = () => {
    const elementNumber = parseInt(selectedElementNumber);
    if (isNaN(elementNumber)) return;

    chrome.runtime.sendMessage(
      { action: 'selectElementByNumber', elementNumber },
      (response) => {
        if (response?.success) {
          const newStep: AutomationStep = {
            type: 'click',
            selector: response.elementData.selector,
            elementData: response.elementData,
          };
          setSteps([...steps, newStep]);
          setIsSelecting(false);
          setSelectedElementNumber('');
          chrome.runtime.sendMessage({ action: 'stopSelection' });
        }
      }
    );
  };

  const handleStepEdit = (index: number, updatedStep: AutomationStep) => {
    const newSteps = [...steps];
    newSteps[index] = updatedStep;
    setSteps(newSteps);
  };

  const handleStepDelete = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleStepMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setSteps(newSteps);
  };

  return (
    <div className="view-container">
      <div className="form-group">
        <label className="form-label">{UI_TEXT.SCENARIO_NAME}</label>
        <input
          type="text"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={UI_TEXT.SCENARIO_NAME_PLACEHOLDER}
          maxLength={APP_CONFIG.MAX_SCENARIO_NAME_LENGTH}
        />
      </div>

      <div className="form-group">
        <label className="form-label">{UI_TEXT.URL_RESTRICTION}</label>
        <input
          type="text"
          className="form-input"
          value={urlRestriction}
          onChange={(e) => setUrlRestriction(e.target.value)}
          placeholder={UI_TEXT.URL_RESTRICTION_PLACEHOLDER}
        />
        <div className="form-help">{UI_TEXT.URL_RESTRICTION_HELP}</div>
      </div>

      <div className="steps-container">
        <div className="steps-header">
          <h3 className="steps-title">{UI_TEXT.STEPS_TITLE}</h3>
          <button className="btn btn-primary" onClick={handleStartElementSelection}>
            <i className="fa-solid fa-crosshairs"></i>
            {UI_TEXT.ADD_STEP_BY_ELEMENT}
          </button>
        </div>

        {isSelecting && (
          <SelectionUI
            selectedElementNumber={selectedElementNumber}
            onElementNumberChange={setSelectedElementNumber}
            onSelect={handleSelectElement}
            onCancel={() => {
              setIsSelecting(false);
              setSelectedElementNumber('');
              chrome.runtime.sendMessage({ action: 'stopSelection' });
            }}
          />
        )}

        {steps.length === 0 ? (
          <EmptyState
            icon="fa-solid fa-list-check"
            title={UI_TEXT.NO_STEPS}
            description="Add your first automation step to get started"
            action={
              <button className="btn btn-primary" onClick={handleStartElementSelection}>
                <i className="fa-solid fa-crosshairs"></i>
                {UI_TEXT.ADD_STEP_BY_ELEMENT}
              </button>
            }
          />
        ) : (
          <div className="steps-list">
            {steps.map((step, index) => (
              <StepItem
                key={index}
                step={step}
                index={index}
                onEdit={(updatedStep) => handleStepEdit(index, updatedStep)}
                onDelete={() => handleStepDelete(index)}
                onMoveUp={() => handleStepMove(index, 'up')}
                onMoveDown={() => handleStepMove(index, 'down')}
                canMoveUp={index > 0}
                canMoveDown={index < steps.length - 1}
              />
            ))}
          </div>
        )}

        <Toolbox onAddStep={handleAddToolboxStep} />
      </div>

      <div className="card-footer">
        <button className="btn" onClick={onCancel}>
          {UI_TEXT.CANCEL}
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          {UI_TEXT.SAVE}
        </button>
      </div>
    </div>
  );
};

// === SELECTION UI COMPONENT ===
interface SelectionUIProps {
  selectedElementNumber: string;
  onElementNumberChange: (value: string) => void;
  onSelect: () => void;
  onCancel: () => void;
}

const SelectionUI: React.FC<SelectionUIProps> = ({
  selectedElementNumber,
  onElementNumberChange,
  onSelect,
  onCancel,
}) => (
  <div className="selection-ui">
    <h4 className="selection-title">{UI_TEXT.SELECTION_TITLE}</h4>
    <p className="selection-instruction">{UI_TEXT.SELECTION_INSTRUCTION}</p>
    <div className="selection-actions">
      <input
        type="number"
        className="form-input selection-input"
        value={selectedElementNumber}
        onChange={(e) => onElementNumberChange(e.target.value)}
        placeholder={UI_TEXT.SELECTION_NUMBER_PLACEHOLDER}
        min="1"
      />
      <button className="btn btn-primary" onClick={onSelect} disabled={!selectedElementNumber}>
        {UI_TEXT.SELECT}
      </button>
      <button className="btn" onClick={onCancel}>
        {UI_TEXT.CANCEL}
      </button>
    </div>
  </div>
);

// === STEP ITEM COMPONENT ===
interface StepItemProps {
  step: AutomationStep;
  index: number;
  onEdit: (step: AutomationStep) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const StepItem: React.FC<StepItemProps> = ({
  step,
  index,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) => {
  const displayInfo = getStepDisplayInfo(step);

  return (
    <div className="step-item">
      <div className="step-icon" style={{ color: displayInfo.color }}>
        <i className={displayInfo.icon}></i>
      </div>
      <div className="step-content">
        <span className={step.type === 'comment' ? 'step-comment' : ''}>
          {displayInfo.text}
        </span>
        {displayInfo.hasSelector && (
          <span className="value">{displayInfo.selector}</span>
        )}
        {displayInfo.hasVariable && (
          <>
            <i className="fa-solid fa-arrow-right-long" style={{ margin: '0 6px' }}></i>
            <span className="variable">{displayInfo.variable}</span>
          </>
        )}
      </div>
      <div className="step-actions">
        {canMoveUp && (
          <button className="btn btn-sm btn-ghost" onClick={onMoveUp} title={UI_TEXT.TOOLTIP_MOVE_UP}>
            <i className="fa-solid fa-arrow-up"></i>
          </button>
        )}
        {canMoveDown && (
          <button className="btn btn-sm btn-ghost" onClick={onMoveDown} title={UI_TEXT.TOOLTIP_MOVE_DOWN}>
            <i className="fa-solid fa-arrow-down"></i>
          </button>
        )}
        <button className="btn btn-sm btn-ghost" onClick={() => onEdit(step)} title={UI_TEXT.TOOLTIP_EDIT_STEP}>
          <i className="fa-solid fa-edit"></i>
        </button>
        <button className="btn btn-sm btn-danger" onClick={onDelete} title={UI_TEXT.TOOLTIP_DELETE_STEP}>
          <i className="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  );
};

// === TOOLBOX COMPONENT ===
interface ToolboxProps {
  onAddStep: (stepType: StepType) => void;
}

const Toolbox: React.FC<ToolboxProps> = ({ onAddStep }) => {
  const toolboxSteps: { type: StepType; label: string }[] = [
    { type: 'wait', label: UI_TEXT.WAIT },
    { type: 'comment', label: UI_TEXT.COMMENT },
    { type: 'screenshot', label: UI_TEXT.SCREENSHOT },
    { type: 'scroll', label: UI_TEXT.SCROLL },
    { type: 'if_start', label: UI_TEXT.IF },
    { type: 'else_block', label: UI_TEXT.ELSE },
    { type: 'if_end', label: UI_TEXT.END_IF },
    { type: 'loop_start', label: UI_TEXT.LOOP },
    { type: 'loop_end', label: UI_TEXT.END_LOOP },
  ];

  return (
    <div className="toolbox">
      <h4 className="toolbox-title">{UI_TEXT.TOOLBOX}</h4>
      <div className="toolbox-grid">
        {toolboxSteps.map(({ type, label }) => {
          const config = STEP_CONFIGS[type];
          return (
            <div key={type} className="toolbox-item" onClick={() => onAddStep(type)}>
              <i className={config.icon} style={{ color: config.color }}></i>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// === RENDER APP ===
const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
