import React, { useState, useEffect, useCallback } from 'react';
import { createRoot, createPortal } from 'react-dom/client';
import './popup/popup.css';

// --- TYPE DEFINITIONS ---
interface Step {
  tip: string;
  deger?: string;
  metin?: string;
  degisken?: string;
  ms?: number | string;
  sayi?: number | string;
  elementData?: any;
}
interface Scenario { id: string; baslik: string; urlKisitlamasi: string; adimlar: Step[]; }
interface Scenarios { [key:string]: Scenario; }

// --- HELPERS (Omitted for brevity) ---
const getStepDetails = (step: Step) => { /* ... */
    const v = step.deger ? <span className="value">{step.deger}</span> : '';
    const t = step.metin ? <span className="value">{step.metin}</span> : '';
    const variable = step.degisken ? <><i className="fa-solid fa-arrow-right-long" style={{ margin: '0 6px' }}></i><span className="variable">{step.degisken}</span></> : '';
    switch (step.tip) {
        case 'tıkla': return { icon: 'fa-solid fa-hand-pointer', content: <><b>Click:</b> {v}</>, color: 'var(--primary-color)' };
        case 'yaz': return { icon: 'fa-solid fa-keyboard', content: <><b>Type</b> {t} into {v}</>, color: 'var(--primary-color)' };
        case 'kopyala': return { icon: 'fa-solid fa-copy', content: <><b>Copy from:</b> {v} {variable}</>, color: 'var(--primary-color)' };
        case 'wait': return { icon: 'fa-solid fa-clock', content: <><b>Wait:</b> {step.ms || 1000}ms</>, color: '#faad14' };
        case 'comment': return { icon: 'fa-solid fa-comment-dots', content: <i className="step-comment">{step.metin || '...'}</i>, color: 'var(--comment-color)' };
        case 'screenshot': return { icon: 'fa-solid fa-camera', content: <b>Screenshot</b>, color: '#722ed1' };
        case 'scroll': return { icon: 'fa-solid fa-arrows-down-to-line', content: <b>Scroll Page</b>, color: '#722ed1' };
        case 'if_start': return { icon: 'fa-solid fa-question', content: <><b>IF</b> {v} exists</>, color: 'var(--block-color)' };
        case 'else_block': return { icon: 'fa-solid fa-arrows-split-up-and-left', content: <b>ELSE</b>, color: 'var(--block-color)' };
        case 'if_end': return { icon: 'fa-solid fa-check-double', content: <b>END IF</b>, color: 'var(--block-color)' };
        case 'loop_start': return { icon: 'fa-solid fa-repeat', content: <><b>LOOP</b> {step.sayi || 'N'} times</>, color: 'var(--block-color)' };
        case 'loop_end': return { icon: 'fa-solid fa-circle-stop', content: <b>END LOOP</b>, color: 'var(--block-color)' };
        default: return { icon: 'fa-solid fa-question-circle', content: 'Unknown Step', color: 'var(--danger-color)' };
    }
};

// --- MAIN APP ---
const App: React.FC = () => {
    // State and effects... (Omitted for brevity)
    const [scenarios, setScenarios] = useState<Scenarios>({});
    const [view, setView] = useState<'main' | 'editor'>('main');
    const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
    const [status, setStatus] = useState({ message: '', type: '' });

    useEffect(() => {
        chrome.runtime.sendMessage({ action: 'getInitialData' }, (response) => {
            if (response) setScenarios(response.scenarios || {});
        });
        const listener = (req: any) => {
            if (req.action === 'updateRunStatus') setStatus({ message: req.status.messageKey, type: req.status.type });
        };
        chrome.runtime.onMessage.addListener(listener);
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, []);

    const saveScenariosToStorage = useCallback((newScenarios: Scenarios) => {
        setScenarios(newScenarios);
        chrome.runtime.sendMessage({ action: 'saveScenarios', data: newScenarios });
    }, []);

    const handleCreateScenario = () => {
        const newId = `scenario_${Date.now()}`;
        const newScenarios = { ...scenarios, [newId]: { id: newId, baslik: 'Untitled', urlKisitlamasi: '', adimlar: [] } };
        saveScenariosToStorage(newScenarios);
        setActiveScenarioId(newId);
        setView('editor');
    };

    const handleDeleteScenario = (id: string) => {
        if (window.confirm(`Delete "${scenarios[id].baslik}"?`)) {
            const newScenarios = { ...scenarios };
            delete newScenarios[id];
            saveScenariosToStorage(newScenarios);
        }
    };

    const handleUpdateScenario = (updatedScenario: Scenario) => {
        const newScenarios = { ...scenarios, [updatedScenario.id]: updatedScenario };
        saveScenariosToStorage(newScenarios);
    };

    const activeScenario = activeScenarioId ? scenarios[activeScenarioId] : null;

    return (
        <div className="app-container">
            {view === 'main' ? (
                <MainView scenarios={scenarios} onCreate={handleCreateScenario} onSelect={(id) => { setActiveScenarioId(id); setView('editor'); }} onDelete={handleDeleteScenario} />
            ) : (
                activeScenario && <EditorView scenario={activeScenario} onBack={() => { setView('main'); setActiveScenarioId(null); }} onUpdate={handleUpdateScenario} />
            )}
            {status.message && <div className={`app-footer ${status.type}`}>{status.message}</div>}
        </div>
    );
};


// --- VIEWS AND MAIN COMPONENTS ---

const MainView: React.FC<{ scenarios: Scenarios; onCreate: () => void; onSelect: (id: string) => void; onDelete: (id: string) => void; }> = ({ scenarios, onCreate, onSelect, onDelete }) => (
    <>
        <header className="app-header"><h1>My Scenarios</h1><button className="btn btn-primary" onClick={onCreate}><i className="fa-solid fa-plus"></i> New</button></header>
        <div className="view-container">
            <div className="scenario-list">
                {Object.values(scenarios).map((s) => (
                    <div key={s.id} className="scenario-card" onClick={() => onSelect(s.id)}>
                        <h3>{s.baslik}</h3>
                        <button className="btn-icon btn-danger" onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}><i className="fa-solid fa-trash"></i></button>
                    </div>
                ))}
            </div>
        </div>
    </>
);

const EditorView: React.FC<{ scenario: Scenario; onBack: () => void; onUpdate: (s: Scenario) => void; }> = ({ scenario, onBack, onUpdate }) => {
    const [localScenario, setLocalScenario] = useState(scenario);
    const [editingStepInfo, setEditingStepInfo] = useState<{ step: Step; index: number } | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionNumber, setSelectionNumber] = useState("");
    const [selectionError, setSelectionError] = useState("");

    const handleSave = () => onUpdate(localScenario);
    const handleRun = () => { handleSave(); chrome.runtime.sendMessage({ action: 'runScenario', scenarioId: localScenario.id, allScenarios: { [localScenario.id]: localScenario } }); };

    const updateSteps = (newSteps: Step[]) => setLocalScenario(p => ({ ...p, adimlar: newSteps }));

    const handleSaveStep = (step: Step, index: number) => {
        const newSteps = [...localScenario.adimlar];
        if (index === -1) newSteps.push(step);
        else newSteps[index] = step;
        updateSteps(newSteps);
        setEditingStepInfo(null);
    };

    const handleStartSelection = () => {
        setIsSelecting(true);
        setSelectionError("");
        chrome.runtime.sendMessage({ action: 'startSelection' });
    };

    const handleConfirmSelection = () => {
        const num = parseInt(selectionNumber, 10);
        if (isNaN(num) || num <= 0) {
            setSelectionError("Please enter a valid number.");
            return;
        }
        chrome.runtime.sendMessage({ action: 'selectElementByNumber', elementNumber: num }, (res) => {
            if (res && res.success) {
                setEditingStepInfo({ step: { tip: 'tıkla', deger: res.elementData.selector, elementData: res.elementData }, index: -1 });
                setIsSelecting(false);
                setSelectionNumber("");
            } else {
                setSelectionError(res.error || "Element selection failed.");
            }
        });
    };

    const handleCancelSelection = () => {
        setIsSelecting(false);
        chrome.runtime.sendMessage({ action: 'stopSelection' });
    };

    useEffect(() => { return () => { onUpdate(localScenario); } }, [localScenario, onUpdate]);

    return (
        <>
            <header className="app-header">
                <button className="btn" onClick={onBack}><i className="fa-solid fa-arrow-left"></i> Back</button>
                <div className="header-actions">
                    <button className="btn" onClick={handleRun}><i className="fa-solid fa-play"></i> Run</button>
                    <button className="btn btn-primary" onClick={handleSave}><i className="fa-solid fa-save"></i> Save</button>
                </div>
            </header>
            <div className="view-container">
                <div className="editor-header">
                    <input type="text" value={localScenario.baslik} onChange={e => setLocalScenario(p => ({ ...p, baslik: e.target.value }))} />
                    <input type="text" placeholder="URL constraint..." value={localScenario.urlKisitlamasi} onChange={e => setLocalScenario(p => ({ ...p, urlKisitlamasi: e.target.value }))} />
                </div>

                {!isSelecting ? (
                    <button className="btn" style={{ width: '100%', marginBottom: '16px' }} onClick={handleStartSelection}><i className="fa-solid fa-hand-pointer"></i> Add Step by Selection</button>
                ) : (
                    <div className="selection-ui">
                        <p>Go to the page and enter the number of the element you want to select.</p>
                        <input type="number" value={selectionNumber} onChange={e => setSelectionNumber(e.target.value)} placeholder="Enter number..." autoFocus />
                        <div className="selection-actions">
                            <button className="btn" onClick={handleCancelSelection}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleConfirmSelection}>Select</button>
                        </div>
                        {selectionError && <p className="error-text">{selectionError}</p>}
                    </div>
                )}

                <div className="steps-container">
                    {localScenario.adimlar.map((step, index) => (
                        <StepCard key={index} step={step} onEdit={() => setEditingStepInfo({ step: localScenario.adimlar[index], index })} onDelete={() => updateSteps(localScenario.adimlar.filter((_, i) => i !== index))} />
                    ))}
                </div>
                <Toolbox onAddStep={(type) => setEditingStepInfo({ step: { tip: type }, index: -1 })} />
            </div>
            {editingStepInfo && (
                <EditStepModal stepInfo={editingStepInfo} onSave={handleSaveStep} onClose={() => setEditingStepInfo(null)} />
            )}
        </>
    );
};

// --- ATOMIC & REUSABLE COMPONENTS (Omitted for brevity) ---
const StepCard: React.FC<{ step: Step; onEdit: () => void; onDelete: () => void; }> = ({ step, onEdit, onDelete }) => { /* ... */
    const { icon, content, color } = getStepDetails(step);
    return (
        <div className="step-card">
            <span className="icon" style={{ color }}><i className={icon}></i></span>
            <div className="details">{content}</div>
            <div className="actions">
                <button className="btn-icon" onClick={onEdit}><i className="fa-solid fa-pencil"></i></button>
                <button className="btn-icon btn-danger" onClick={onDelete}><i className="fa-solid fa-trash"></i></button>
            </div>
        </div>
    );
};
const Toolbox: React.FC<{ onAddStep: (type: string) => void }> = ({ onAddStep }) => { /* ... */
    return (
        <div className="toolbox">
            <h3>Toolbox</h3>
            <div className="toolbox-buttons">
                {['wait', 'comment', 'screenshot', 'scroll', 'if_start', 'else_block', 'if_end', 'loop_start', 'loop_end'].map(type => (
                    <button key={type} className="btn" onClick={() => onAddStep(type)}>{type.replace('_', ' ').toUpperCase()}</button>
                ))}
            </div>
        </div>
    );
};
const Modal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void; footer: React.ReactNode; }> = ({ title, children, onClose, footer }) => { /* ... */
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;
    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>{title}</h2><button onClick={onClose} className="btn-icon">&times;</button></div>
                <div className="modal-body">{children}</div>
                <div className="modal-footer">{footer}</div>
            </div>
        </div>,
        modalRoot
    );
};
const EditStepModal: React.FC<{ stepInfo: { step: Step; index: number }; onClose: () => void; onSave: (step: Step, index: number) => void; }> = ({ stepInfo, onClose, onSave }) => {
    const [step, setStep] = useState(stepInfo.step);
    const handleSave = () => onSave(step, stepInfo.index);

    const renderField = () => {
        if (step.elementData) { // Action for a selected element
            return (
                <>
                    <div className="element-preview">Selector: <code>{step.deger}</code></div>
                    <label>Action</label>
                    <select value={step.tip} onChange={e => setStep(p => ({...p, tip: e.target.value}))}>
                        <option value="tıkla">Click</option>
                        <option value="yaz">Type</option>
                        <option value="kopyala">Copy</option>
                    </select>
                    {step.tip === 'yaz' && <><label>Text to Type</label><input type="text" value={step.metin || ''} onChange={e => setStep(p => ({...p, metin: e.target.value}))} /></>}
                    {step.tip === 'kopyala' && <><label>Variable Name</label><input type="text" value={step.degisken || ''} onChange={e => setStep(p => ({...p, degisken: e.target.value}))} /></>}
                </>
            );
        }
        // Toolbox actions
        switch (step.tip) {
            case 'wait': return <><label>Duration (ms)</label><input type="number" value={step.ms || ''} onChange={e => setStep({ ...step, ms: e.target.value })} /></>;
            case 'comment': return <><label>Comment</label><textarea value={step.metin || ''} onChange={e => setStep({ ...step, metin: e.target.value })} /></>;
            case 'loop_start': return <><label>Repetitions</label><input type="number" value={step.sayi || ''} onChange={e => setStep({ ...step, sayi: e.target.value })} /></>;
            case 'if_start': return <><label>Selector</label><input type="text" placeholder="e.g., #my-button" value={step.deger || ''} onChange={e => setStep({ ...step, deger: e.target.value })} /></>;
            default: return <p>This step type has no editable parameters.</p>;
        }
    };

    const modalTitle = step.elementData ? 'Configure Action' : `Edit Step: ${step.tip.toUpperCase()}`;

    return (
        <Modal title={modalTitle} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
            <div className="form-group">{renderField()}</div>
        </Modal>
    );
};

// --- STYLES & RENDER ---
const dynamicStyles = `
.selection-ui { border: 1px solid #91d5ff; background: #e6f7ff; padding: 15px; border-radius: 4px; margin-bottom: 16px; }
.selection-ui p { margin: 0 0 10px; }
.selection-ui input { width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #91d5ff; border-radius: 4px; margin-bottom: 10px; }
.selection-actions { display: flex; justify-content: flex-end; gap: 10px; }
.error-text { color: var(--danger-color); font-size: 12px; margin-top: 5px; }
.element-preview { background: #f0f0f0; padding: 8px; border-radius: 4px; margin-bottom: 10px; font-family: monospace; font-size: 12px; }
.modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: white; padding: 20px; border-radius: 8px; min-width: 350px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
.modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
.modal-header h2 { margin: 0; font-size: 18px; }
.modal-footer { border-top: 1px solid #eee; padding-top: 10px; margin-top: 15px; text-align: right; }
.modal-footer .btn { margin-left: 10px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-weight: bold; }
.form-group input, .form-group textarea, .form-group select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = dynamicStyles;
document.head.appendChild(styleSheet);

const container = document.getElementById('root');
if (container) createRoot(container).render(<React.StrictMode><App /></React.StrictMode>);
