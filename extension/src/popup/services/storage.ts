import type { Scenario } from '../types';

export const STORAGE_KEYS = {
  SCENARIOS: 'sisypi_scenarios',
  ACTIVE_RECORDING_SCENARIO_ID: 'sisypi_activeRecordingScenarioId',
  RECORDING_TAB_ID: 'sisypi_recordingTabId',
};

/**
 * Retrieves all scenarios from chrome.storage.local.
 * @returns A promise that resolves to an array of scenarios.
 */
export const getScenarios = async (): Promise<Scenario[]> => {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SCENARIOS);
  return result[STORAGE_KEYS.SCENARIOS] || [];
};

/**
 * Retrieves a single scenario by its ID.
 * @param scenarioId The ID of the scenario to retrieve.
 * @returns A promise that resolves to the Scenario or null if not found.
 */
export const getScenarioById = async (scenarioId: string): Promise<Scenario | null> => {
    const scenarios = await getScenarios();
    return scenarios.find(s => s.scenarioId === scenarioId) || null;
};


/**
 * Saves a single scenario. If it exists, it's updated. If not, it's added.
 * @param scenario The scenario object to save.
 * @returns A promise that resolves when the operation is complete.
 */
export const saveScenario = async (scenario: Scenario): Promise<void> => {
  const scenarios = await getScenarios();
  const existingIndex = scenarios.findIndex(s => s.scenarioId === scenario.scenarioId);

  if (existingIndex > -1) {
    scenarios[existingIndex] = scenario;
  } else {
    scenarios.push(scenario);
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.SCENARIOS]: scenarios });
};

/**
 * Deletes a scenario by its ID.
 * @param scenarioId The ID of the scenario to delete.
 * @returns A promise that resolves when the operation is complete.
 */
export const deleteScenario = async (scenarioId: string): Promise<void> => {
  let scenarios = await getScenarios();
  scenarios = scenarios.filter(s => s.scenarioId !== scenarioId);
  await chrome.storage.local.set({ [STORAGE_KEYS.SCENARIOS]: scenarios });
};
