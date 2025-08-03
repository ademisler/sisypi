import React from 'react';
import { createRoot } from 'react-dom/client';
import './popup/popup.css';

// Import our new architecture components
import { AppProvider, useApp } from './src/context/AppContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { AISettings } from './src/components/AISettings';
import type { AutomationStep, StepType, Scenario } from './src/types';
import { UI_TEXT, APP_CONFIG, STEP_CONFIGS } from './src/constants';
import { getStepDisplayInfo } from './src/utils';
import { validateScenario } from './src/validation/validators';
import { aiService } from './src/services/ai-service';

// === MAIN APP COMPONENT ===
const App: React.FC = () => {
  const { state, actions } = useApp();
  const [showAISettings, setShowAISettings] = React.useState(false);
  const [isAIEnabled, setIsAIEnabled] = React.useState(false);

  // Load AI settings on mount
  React.useEffect(() => {
    chrome.storage.local.get(['aiEnabled', 'aiApiKey']).then((result) => {
      setIsAIEnabled(result.aiEnabled || false);
      if (result.aiApiKey) {
        aiService.setApiKey(result.aiApiKey);
      }
    });
  }, []);

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
            actions.restoreScenarios(data);
          } catch (error) {
            actions.setError('Invalid backup file format');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } catch (error) {
      actions.setError('Failed to load backup file');
    }
  };

  const handleAISelection = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        actions.setError('No active tab found');
        return;
      }

      // Start AI selection
      await chrome.tabs.sendMessage(tab.id, { action: 'startAISelection' });
      
      // Listen for AI element selection
      const handleAIElementSelected = (message: any) => {
        if (message.action === 'aiElementSelected') {
          console.log('AI Element Selected:', message.elementData);
          
          // Here you can process the AI-selected element
          // For now, we'll just show it in console
          actions.setStatus('AI element selected successfully', 'success');
          
          // Remove listener
          chrome.runtime.onMessage.removeListener(handleAIElementSelected);
        }
      };

      chrome.runtime.onMessage.addListener(handleAIElementSelected);
      
    } catch (error) {
      actions.setError('Failed to start AI selection');
    }
  };

  return (
    <div className="app-container">
      <Header
        view={state.currentView}
        onBack={() => actions.setView('main')}
        onBackupAll={actions.backupScenarios}
        onLoadBackup={handleLoadBackup}
        onAISettings={() => setShowAISettings(true)}
        onAISelection={handleAISelection}
        isAIEnabled={isAIEnabled}
      />
      
      <div className="app-content">
        {state.error && (
          <ErrorMessage message={state.error} onDismiss={() => actions.setError(null)} />
        )}
        
        {state.status.message && (
          <StatusBar message={state.status.message} type={state.status.type} />
        )}
        
        {state.currentView === 'main' ? (
          <MainView />
        ) : (
          <EditorView />
        )}
      </div>

      {showAISettings && (
        <AISettings onClose={() => setShowAISettings(false)} />
      )}
    </div>
  );
};

// === ERROR MESSAGE COMPONENT ===
interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => (
  <div className="status-message status-error">
    <i className="fa-solid fa-exclamation-circle"></i>
    <span>{message}</span>
    <button className="btn btn-sm btn-ghost" onClick={onDismiss} style={{ marginLeft: 'auto' }}>
      <i className="fa-solid fa-times"></i>
    </button>
  </div>
);

// === HEADER COMPONENT ===
interface HeaderProps {
  view: string;
  onBack: () => void;
  onBackupAll: () => void;
  onLoadBackup: () => void;
  onAISettings?: () => void;
  onAISelection?: () => void;
  isAIEnabled?: boolean;
}

const Header: React.FC<HeaderProps> = ({ view, onBack, onBackupAll, onLoadBackup, onAISettings, onAISelection, isAIEnabled }) => (
  <header className="app-header">
    <h1>
      {view === 'main' ? UI_TEXT.MAIN_TITLE : UI_TEXT.EDITOR_TITLE}
    </h1>
    <div className="header-actions">
      {view === 'main' ? (
        <>
          {isAIEnabled && onAISelection && (
            <button className="btn btn-primary" onClick={onAISelection} title="AI Element Selection">
              <i className="fa-solid fa-brain"></i>
              AI Select
            </button>
          )}
          <button className="btn btn-ghost" onClick={onLoadBackup} title={UI_TEXT.TOOLTIP_RESTORE}>
            <i className="fa-solid fa-upload"></i>
          </button>
          <button className="btn btn-ghost" onClick={onBackupAll} title={UI_TEXT.TOOLTIP_BACKUP}>
            <i className="fa-solid fa-download"></i>
          </button>
          {onAISettings && (
            <button className="btn btn-ghost" onClick={onAISettings} title="AI Settings">
              <i className="fa-solid fa-robot"></i>
            </button>
          )}
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
const MainView: React.FC = () => {
  const { state, actions } = useApp();
  const scenarioList = Object.values(state.scenarios);

  return (
    <div className="view-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
          {UI_TEXT.MAIN_TITLE}
        </h2>
        <button className="btn btn-primary" onClick={actions.createScenario}>
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
            <button className="btn btn-primary btn-lg" onClick={actions.createScenario}>
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
              onEdit={() => {
                actions.setActiveScenario(scenario.id);
                actions.setView('editor');
              }}
              onDelete={() => actions.deleteScenario(scenario.id)}
              onRun={() => actions.runScenario(scenario.id)}
              isLoading={state.isLoading}
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
const EditorView: React.FC = () => {
  const { state, actions } = useApp();
  const scenario = state.activeScenarioId ? state.scenarios[state.activeScenarioId] : null;
  
  const [title, setTitle] = React.useState(scenario?.title || '');
  const [urlRestriction, setUrlRestriction] = React.useState(scenario?.urlRestriction || '');
  const [steps, setSteps] = React.useState<AutomationStep[]>(scenario?.steps || []);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [selectedElementNumber, setSelectedElementNumber] = React.useState('');
  const [validationResult, setValidationResult] = React.useState<any>(null);

  // Validate on changes
  React.useEffect(() => {
    if (scenario) {
      const testScenario = {
        ...scenario,
        title: title.trim() || 'Untitled',
        urlRestriction: urlRestriction.trim(),
        steps,
      };
      const validation = validateScenario(testScenario);
      setValidationResult(validation);
    }
  }, [title, urlRestriction, steps, scenario]);

  const handleSave = () => {
    if (!scenario) return;

    const updatedScenario = {
      ...scenario,
      title: title.trim() || 'Untitled',
      urlRestriction: urlRestriction.trim(),
      steps,
      updatedAt: Date.now(),
    };

    const validation = validateScenario(updatedScenario);
    if (!validation.isValid) {
      actions.setError(`Cannot save scenario: ${validation.errors[0]?.message}`);
      return;
    }

    actions.updateScenario(updatedScenario);
    actions.setView('main');
  };

  const handleAddToolboxStep = (stepType: StepType) => {
    const newStep: AutomationStep = {
      type: stepType,
      ...(STEP_CONFIGS[stepType].hasDuration && { duration: 1000 }),
      ...(STEP_CONFIGS[stepType].hasRepetitions && { repetitions: 1 }),
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

      {validationResult && !validationResult.isValid && (
        <div className="validation-errors">
          <div className="validation-title">
            <i className="fa-solid fa-exclamation-triangle"></i>
            Validation Errors
          </div>
          <ul className="validation-list">
            {validationResult.errors.map((error: any, index: number) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {validationResult && validationResult.warnings.length > 0 && (
        <div className="validation-warnings">
          <div className="validation-title">
            <i className="fa-solid fa-exclamation-triangle"></i>
            Warnings
          </div>
          <ul className="validation-list">
            {validationResult.warnings.map((warning: any, index: number) => (
              <li key={index}>{warning.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card-footer">
        <button className="btn" onClick={() => actions.setView('main')}>
          {UI_TEXT.CANCEL}
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handleSave}
          disabled={validationResult && !validationResult.isValid}
        >
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
  index: _index,
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
  const [activeCategory, setActiveCategory] = React.useState('basic');

  const toolboxCategories = {
    basic: {
      title: 'Basic Actions',
      steps: [
        { type: 'wait' as StepType, label: UI_TEXT.WAIT },
        { type: 'comment' as StepType, label: UI_TEXT.COMMENT },
        { type: 'screenshot' as StepType, label: UI_TEXT.SCREENSHOT },
        { type: 'scroll' as StepType, label: UI_TEXT.SCROLL },
      ]
    },
    interactions: {
      title: 'Interactions',
      steps: [
        { type: 'hover' as StepType, label: UI_TEXT.HOVER },
        { type: 'double_click' as StepType, label: UI_TEXT.DOUBLE_CLICK },
        { type: 'right_click' as StepType, label: UI_TEXT.RIGHT_CLICK },
        { type: 'focus' as StepType, label: UI_TEXT.FOCUS },
        { type: 'blur' as StepType, label: UI_TEXT.BLUR },
        { type: 'clear_field' as StepType, label: UI_TEXT.CLEAR_FIELD },
      ]
    },
    forms: {
      title: 'Form Controls',
      steps: [
        { type: 'select_option' as StepType, label: UI_TEXT.SELECT_OPTION },
        { type: 'check_checkbox' as StepType, label: UI_TEXT.CHECK_CHECKBOX },
        { type: 'uncheck_checkbox' as StepType, label: UI_TEXT.UNCHECK_CHECKBOX },
        { type: 'press_key' as StepType, label: UI_TEXT.PRESS_KEY },
      ]
    },
    waiting: {
      title: 'Wait & Assert',
      steps: [
        { type: 'wait_for_element' as StepType, label: UI_TEXT.WAIT_FOR_ELEMENT },
        { type: 'wait_for_text' as StepType, label: UI_TEXT.WAIT_FOR_TEXT },
        { type: 'assert_text' as StepType, label: UI_TEXT.ASSERT_TEXT },
        { type: 'assert_element' as StepType, label: UI_TEXT.ASSERT_ELEMENT },
      ]
    },
    advanced: {
      title: 'Advanced',
      steps: [
        { type: 'extract_attribute' as StepType, label: UI_TEXT.EXTRACT_ATTRIBUTE },
        { type: 'scroll_to_element' as StepType, label: UI_TEXT.SCROLL_TO_ELEMENT },
      ]
    },
    control: {
      title: 'Control Flow',
      steps: [
        { type: 'if_start' as StepType, label: UI_TEXT.IF },
        { type: 'else_block' as StepType, label: UI_TEXT.ELSE },
        { type: 'if_end' as StepType, label: UI_TEXT.END_IF },
        { type: 'loop_start' as StepType, label: UI_TEXT.LOOP },
        { type: 'loop_end' as StepType, label: UI_TEXT.END_LOOP },
      ]
    }
  };

  return (
    <div className="toolbox">
      <h4 className="toolbox-title">{UI_TEXT.TOOLBOX}</h4>
      
      {/* Category Tabs */}
      <div className="toolbox-tabs">
        {Object.entries(toolboxCategories).map(([key, category]) => (
          <button
            key={key}
            className={`toolbox-tab ${activeCategory === key ? 'active' : ''}`}
            onClick={() => setActiveCategory(key)}
          >
            {category.title}
          </button>
        ))}
      </div>

      {/* Steps Grid */}
      <div className="toolbox-grid">
        {toolboxCategories[activeCategory as keyof typeof toolboxCategories].steps.map(({ type, label }) => {
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
      <ErrorBoundary>
        <AppProvider>
          <App />
        </AppProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
