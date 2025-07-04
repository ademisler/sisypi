import React, { useState } from 'react';
import ScenarioList from './components/ScenarioList';
import ScenarioEditor from './components/ScenarioEditor';

type View = 'list' | 'editor';

const App: React.FC = () => {
  const [view, setView] = useState<View>('list');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const handleEditScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setView('editor');
  };

  const handleBackToList = () => {
    setSelectedScenarioId(null);
    setView('list');
  };

  return (
    <div className="container">
      {view === 'list' && <ScenarioList onEditScenario={handleEditScenario} />}
      {view === 'editor' && selectedScenarioId && (
        <ScenarioEditor
          scenarioId={selectedScenarioId}
          onBack={handleBackToList}
        />
      )}
    </div>
  );
};

export default App;
