import React, { useState, useEffect } from 'react';
import { aiService } from '../services/ai-service';

interface AISettingsProps {
  onClose: () => void;
}

export const AISettings: React.FC<AISettingsProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Load saved API key
    chrome.storage.local.get(['aiApiKey', 'aiEnabled']).then((result) => {
      if (result.aiApiKey) {
        setApiKey(result.aiApiKey);
        aiService.setApiKey(result.aiApiKey);
      }
      setIsEnabled(result.aiEnabled || false);
    });
  }, []);

  const handleSaveSettings = async () => {
    try {
      await chrome.storage.local.set({ 
        aiApiKey: apiKey,
        aiEnabled: isEnabled 
      });
      
      if (apiKey) {
        aiService.setApiKey(apiKey);
      }
      
      alert('AI settings saved successfully!');
    } catch (error) {
      alert('Failed to save AI settings');
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      alert('Please enter an API key first');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');

    try {
      aiService.setApiKey(apiKey);
      const isConnected = await aiService.testConnection();
      
      setConnectionStatus(isConnected ? 'success' : 'error');
      
      if (isConnected) {
        alert('✅ AI connection successful!');
      } else {
        alert('❌ AI connection failed. Please check your API key.');
      }
    } catch (error) {
      setConnectionStatus('error');
      alert('❌ Connection test failed: ' + error.message);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleGetApiKey = () => {
    window.open('https://aistudio.google.com/app/apikey', '_blank');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>🤖 AI Settings</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">
              <i className="fa-solid fa-robot"></i>
              Enable AI-Powered Features
            </label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="ai-enabled"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
              />
              <label htmlFor="ai-enabled" className="toggle-label">
                <span className="toggle-inner"></span>
                <span className="toggle-switch-slider"></span>
              </label>
            </div>
            <p className="form-help">
              Enable AI-powered element analysis and automation suggestions
            </p>
          </div>

          {isEnabled && (
            <>
              <div className="form-group">
                <label className="form-label">
                  <i className="fa-solid fa-key"></i>
                  Google Gemini API Key
                </label>
                <div className="input-group">
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter your Gemini API key..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <button 
                    className="btn btn-secondary"
                    onClick={handleGetApiKey}
                    title="Get API Key"
                  >
                    <i className="fa-solid fa-external-link"></i>
                  </button>
                </div>
                <p className="form-help">
                  Get your free API key from Google AI Studio. Your key is stored locally and never shared.
                </p>
              </div>

              <div className="form-group">
                <button
                  className={`btn ${connectionStatus === 'success' ? 'btn-success' : connectionStatus === 'error' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={handleTestConnection}
                  disabled={isTestingConnection || !apiKey}
                >
                  {isTestingConnection ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      Testing Connection...
                    </>
                  ) : connectionStatus === 'success' ? (
                    <>
                      <i className="fa-solid fa-check"></i>
                      Connection Successful
                    </>
                  ) : connectionStatus === 'error' ? (
                    <>
                      <i className="fa-solid fa-times"></i>
                      Connection Failed
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-plug"></i>
                      Test Connection
                    </>
                  )}
                </button>
              </div>

              <div className="ai-features-info">
                <h4>🌟 AI Features</h4>
                <ul>
                  <li>
                    <i className="fa-solid fa-mouse-pointer"></i>
                    <strong>Smart Element Selection:</strong> Click elements instead of numbers
                  </li>
                  <li>
                    <i className="fa-solid fa-brain"></i>
                    <strong>Intelligent Selectors:</strong> AI generates reliable CSS selectors
                  </li>
                  <li>
                    <i className="fa-solid fa-magic-wand-sparkles"></i>
                    <strong>Automation Suggestions:</strong> AI suggests complete workflows
                  </li>
                  <li>
                    <i className="fa-solid fa-shield-check"></i>
                    <strong>Robust Automation:</strong> Self-healing selectors and fallbacks
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSaveSettings}>
            <i className="fa-solid fa-save"></i>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// CSS Styles for toggle switch
const toggleStyles = `
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  margin: 8px 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.toggle-label:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-label {
  background-color: var(--primary-color);
}

input:checked + .toggle-label:before {
  transform: translateX(26px);
}

.ai-features-info {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.ai-features-info h4 {
  margin: 0 0 12px 0;
  color: var(--text-primary);
}

.ai-features-info ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ai-features-info li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.ai-features-info li:last-child {
  border-bottom: none;
}

.ai-features-info i {
  color: var(--primary-color);
  width: 16px;
}

.input-group {
  display: flex;
  gap: 8px;
}

.input-group .form-input {
  flex: 1;
}

.input-group .btn {
  flex-shrink: 0;
}
`;

// Inject styles
if (!document.getElementById('ai-settings-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'ai-settings-styles';
  styleElement.textContent = toggleStyles;
  document.head.appendChild(styleElement);
}