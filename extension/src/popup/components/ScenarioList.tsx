import React, { useState, useEffect, useRef } from 'react';
import { getMessage } from '../services/i18n';
import { getScenarios, saveScenario, deleteScenario, STORAGE_KEYS } from '../services/storage';
import type { Scenario } from '../types';

interface ScenarioListProps {
  onEditScenario: (scenarioId: string) => void;
}

const ScenarioList: React.FC<ScenarioListProps> = ({ onEditScenario }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadScenarios = async () => {
    const storedScenarios = await getScenarios();
    setScenarios(storedScenarios);
  };

  const checkRecordingStatus = async () => {
    const result = await chrome.storage.local.get(STORAGE_KEYS.ACTIVE_RECORDING_SCENARIO_ID);
    setIsRecording(!!result[STORAGE_KEYS.ACTIVE_RECORDING_SCENARIO_ID]);
  };

  useEffect(() => {
    loadScenarios();
    checkRecordingStatus();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
        if (areaName === 'local') {
            if (changes[STORAGE_KEYS.SCENARIOS]) {
                loadScenarios();
            }
            if (changes[STORAGE_KEYS.ACTIVE_RECORDING_SCENARIO_ID]) {
                checkRecordingStatus();
            }
        }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleNewScenario = async () => {
    const newScenario: Scenario = {
      scenarioId: `scn_${Date.now()}`,
      name: `New Scenario ${scenarios.length + 1}`,
      createdAt: new Date().toISOString(),
      blocks: [],
    };
    await saveScenario(newScenario);
    onEditScenario(newScenario.scenarioId);
  };
  
  const handleRun = (scenarioId: string) => {
    chrome.runtime.sendMessage({
      type: 'RUN_SCENARIO',
      payload: { scenarioId }
    });
    onEditScenario(scenarioId); // Switch to editor to view progress
  };

  const handleDelete = async (scenarioId: string) => {
    if (window.confirm(`Are you sure you want to delete this scenario?`)) {
        await deleteScenario(scenarioId);
    }
  };

  const handleToggleRecording = () => {
    chrome.runtime.sendMessage({ type: isRecording ? 'STOP_RECORDING' : 'START_RECORDING' });
    if (!isRecording) {
      window.close(); // Close popup to let user interact with the page
    }
  };

  const handleExport = (scenario: Scenario) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenario, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${scenario.name.replace(/ /g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (!event.target.files) return;
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = async e => {
      if (e.target?.result) {
        try {
          const importedScenario = JSON.parse(e.target.result as string) as Scenario;
          // Basic validation
          if (importedScenario.scenarioId && importedScenario.name && Array.isArray(importedScenario.blocks)) {
            await saveScenario(importedScenario);
          } else {
            alert('Invalid scenario file format.');
          }
        } catch (error) {
          console.error("Error parsing imported JSON:", error);
          alert('Failed to import scenario. Please check the file content.');
        }
      }
    };
  };

  return (
    <>
      <header className="header">
        <h1>{getMessage('extName')}</h1>
        <div>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept=".json" />
          <button onClick={handleImportClick} className="button-secondary" style={{marginRight: '8px'}}>{getMessage('importScenario')}</button>
          <button onClick={handleNewScenario}>{getMessage('newScenario')}</button>
        </div>
      </header>
      <main>
        <div className="record-button-wrapper">
          {isRecording && <div className="recording-status">{getMessage('recordingInProgress')}</div>}
          <button onClick={handleToggleRecording} className={`record-button button ${isRecording ? 'button-danger' : 'button-secondary'}`}>
            {getMessage(isRecording ? 'stopRecording' : 'startRecording')}
          </button>
        </div>
        <ul className="scenario-list">
          {scenarios.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((scenario) => (
            <li key={scenario.scenarioId} className="scenario-item">
              <span>{scenario.name}</span>
              <div className="actions">
                <button onClick={() => handleRun(scenario.scenarioId)}>{getMessage('runScenario')}</button>
                <button onClick={() => onEditScenario(scenario.scenarioId)}>{getMessage('editScenario')}</button>
                <button onClick={() => handleExport(scenario)}>{getMessage('exportScenario')}</button>
                <button className="delete-btn" onClick={() => handleDelete(scenario.scenarioId)}>{getMessage('deleteScenario')}</button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
};

export default ScenarioList;