import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Scenario, Block, BlockType, BlockWithStatus, BlockStatus } from '../types';
import { getScenarioById, saveScenario, STORAGE_KEYS } from '../services/storage';
import { getMessage } from '../services/i18n';
import BlockItem from './BlockItem';

interface ScenarioEditorProps {
  scenarioId: string;
  onBack: () => void;
}

const ScenarioEditor: React.FC<ScenarioEditorProps> = ({ scenarioId, onBack }) => {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [name, setName] = useState('');
  const [blocks, setBlocks] = useState<BlockWithStatus[]>([]);
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const loadScenario = useCallback(async () => {
    const loadedScenario = await getScenarioById(scenarioId);
    setScenario(loadedScenario);
    setName(loadedScenario?.name || '');
    // Initialize blocks with idle status
    const blocksWithStatus = loadedScenario?.blocks.map(b => ({ ...b, status: 'idle' } as BlockWithStatus)) || [];
    setBlocks(blocksWithStatus);
    setRunStatus('idle');
  }, [scenarioId]);

  useEffect(() => {
    loadScenario();
    
    const handleMessage = (message: any) => {
        if (message.type === 'RUN_STATUS_UPDATE' && message.payload) {
            setBlocks(currentBlocks => currentBlocks.map(b => 
                b.id === message.payload.blockId 
                ? { ...b, status: message.payload.status, error: message.payload.error } 
                : b
            ));
            if (message.payload.status !== 'running') {
              setRunStatus(message.payload.status === 'error' ? 'error' : 'running');
            }
        }
        if (message.type === 'RUN_FINISHED') {
          setRunStatus(message.payload.status);
        }
    };
    
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
        if (areaName === 'local' && changes[STORAGE_KEYS.SCENARIOS]) {
            const newScenarios = changes[STORAGE_KEYS.SCENARIOS].newValue as Scenario[];
            const updatedScenario = newScenarios.find(s => s.scenarioId === scenarioId);
             if (updatedScenario) {
                 setBlocks(updatedScenario.blocks.map(b => ({...b, status: 'idle'})));
             }
        }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
        chrome.runtime.onMessage.removeListener(handleMessage);
    };

  }, [scenarioId, loadScenario]);
  
  const handleSave = async () => {
    if (scenario) {
      const updatedScenario: Scenario = { 
        ...scenario, 
        name, 
        blocks: blocks.map(({status, error, ...rest}) => rest) // Strip status before saving
      };
      await saveScenario(updatedScenario);
      onBack();
    }
  };
  
  const handleBlocksChange = (newBlocks: BlockWithStatus[]) => {
      setBlocks(newBlocks);
  };
  
  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const blocksCopy = [...blocks];
    const draggedItemContent = blocksCopy.splice(dragItem.current, 1)[0];
    blocksCopy.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setBlocks(blocksCopy);
  };

  const handleRun = () => {
    // Reset statuses before running
    setBlocks(blocks.map(b => ({...b, status: 'idle', error: undefined})));
    setRunStatus('running');
    chrome.runtime.sendMessage({
      type: 'RUN_SCENARIO',
      payload: { scenarioId }
    });
  };

  const handleAddBlock = (newBlockData: Omit<Block, 'id'>) => {
    const newBlock: BlockWithStatus = {
        id: `blk_${Date.now()}`,
        ...newBlockData,
        status: 'idle'
    };
    setBlocks(currentBlocks => [...currentBlocks, newBlock]);
  };
  
  if (!scenario) {
    return <div>Loading...</div>;
  }

  const runStatusMessage = {
    idle: getMessage('statusIdle'),
    running: getMessage('statusRunning'),
    success: getMessage('statusSuccess'),
    error: getMessage('statusError'),
  }[runStatus];

  return (
    <div>
      <div className="editor-header">
         <button onClick={onBack}>&larr; {getMessage('backToList')}</button>
         <h2>{name}</h2>
         <div>
            <button onClick={handleRun} className="button-secondary" style={{marginRight: '8px'}} disabled={runStatus === 'running'}>{getMessage('runScenario')}</button>
            <button onClick={handleSave}>{getMessage('saveScenario')}</button>
         </div>
      </div>
      <div className={`run-status ${runStatus}`}>{runStatusMessage}</div>

      <div className="form-group">
        <label htmlFor="scenario-name">{getMessage('scenarioName')}</label>
        <input
            id="scenario-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
        />
      </div>

       <h3>{getMessage('steps')}</h3>
       {blocks.length > 0 ? (
            <ul className="block-list">
                {blocks.map((block, index) => (
                    <li 
                      key={block.id} 
                      draggable 
                      onDragStart={() => dragItem.current = index}
                      onDragEnter={() => dragOverItem.current = index}
                      onDragEnd={handleDragSort}
                      onDragOver={(e) => e.preventDefault()}
                      className="block-list-item"
                    >
                      <BlockItem 
                        block={block} 
                        blocks={blocks}
                        onBlocksChange={handleBlocksChange}
                      />
                    </li>
                ))}
            </ul>
        ) : (
            <div className="no-blocks">
                <p>{getMessage('noBlocks')}</p>
            </div>
        )}
        
        <AddBlockForm onAddBlock={handleAddBlock} />
    </div>
  );
};


const AddBlockForm: React.FC<{onAddBlock: (block: Omit<Block, 'id'>) => void}> = ({ onAddBlock }) => {
    const [type, setType] = useState<BlockType>('goToURL');
    const [params, setParams] = useState<Partial<Block>>({url: 'https://'});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddBlock({type, ...params});
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as BlockType;
        setType(newType);
        // Reset params for new type
        if (newType === 'wait') setParams({ duration: 1000 });
        else if (newType === 'goToURL') setParams({ url: 'https://' });
        else if (newType === 'scroll') setParams({ scrollY: 500 });
        else setParams({});
    };
    
    const handleParamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setParams(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
    }

    return (
        <form onSubmit={handleSubmit} className="add-step-form">
            <h4>{getMessage('addStep')}</h4>
            <div className="form-row">
              <select value={type} onChange={handleTypeChange}>
                  <option value="goToURL">Go To URL</option>
                  <option value="clickElement">Click Element</option>
                  <option value="typeText">Type Text</option>
                  <option value="wait">Wait</option>
                  <option value="waitForElement">Wait For Element</option>
                  <option value="copyText">Copy Text</option>
                  <option value="scroll">Scroll</option>
                  <option value="ifElementExists">If Element Exists</option>
                  <option value="loop">Loop</option>
                  <option value="closeTab">Close Tab</option>
              </select>
              <button type="submit">+</button>
            </div>
            <div className="form-fields">
                {type === 'goToURL' && <input name="url" placeholder="URL (e.g., https://google.com)" value={params.url || ''} onChange={handleParamChange} />}
                {type === 'clickElement' && <input name="selector" placeholder="CSS Selector" value={params.selector || ''} onChange={handleParamChange} />}
                {type === 'typeText' && <>
                    <input name="selector" placeholder="CSS Selector" value={params.selector || ''} onChange={handleParamChange} />
                    <input name="value" placeholder="Text to type" value={params.value || ''} onChange={handleParamChange} />
                </>}
                {type === 'wait' && <input name="duration" type="number" placeholder="Milliseconds" value={params.duration || 1000} onChange={handleParamChange} />}
                {type === 'waitForElement' && <>
                    <input name="selector" placeholder="CSS Selector" value={params.selector || ''} onChange={handleParamChange} />
                    <input name="timeout" type="number" placeholder="Timeout (ms)" value={params.timeout || 10000} onChange={handleParamChange} />
                </>}
                {type === 'copyText' && <>
                    <input name="selector" placeholder="CSS Selector" value={params.selector || ''} onChange={handleParamChange} />
                    <input name="saveAsVariable" placeholder="Variable Name (e.g., myVar)" value={params.saveAsVariable || ''} onChange={handleParamChange} />
                </>}
                 {type === 'scroll' && <>
                    <input name="scrollY" type="number" placeholder="Scroll Y pixels" value={params.scrollY || 500} onChange={handleParamChange} />
                    <input name="scrollX" type="number" placeholder="Scroll X pixels" value={params.scrollX || 0} onChange={handleParamChange} />
                </>}
                 {type === 'ifElementExists' && <input name="selector" placeholder="CSS Selector" value={params.selector || ''} onChange={handleParamChange} />}
                 {type === 'loop' && <input name="count" type="number" placeholder="Number of iterations" value={params.count || 3} onChange={handleParamChange} />}
            </div>
        </form>
    )
}

export default ScenarioEditor;
