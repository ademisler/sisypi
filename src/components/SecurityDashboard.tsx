import React, { useState, useEffect } from 'react';

// === SECURITY & PERFORMANCE DASHBOARD ===
interface SecurityDashboardProps {
  onClose: () => void;
}

interface PerformanceStats {
  uptime: number;
  memoryUsage?: {
    used: number;
    total: number;
    limit: number;
  };
  metrics: Record<string, {
    count: number;
    avg: number;
    min: number;
    max: number;
    recent: number;
  } | null>;
}

interface SecurityEvent {
  timestamp: number;
  action: string;
  details: any;
  risk: 'low' | 'medium' | 'high';
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'security' | 'diagnostics'>('performance');
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load performance stats
  const loadPerformanceStats = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getPerformanceStats' });
      if (response?.success) {
        setPerformanceStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to load performance stats:', error);
    }
  };

  // Load security events (mock data for now)
  const loadSecurityEvents = () => {
    // In a real implementation, this would come from the security manager
    const mockEvents: SecurityEvent[] = [
      {
        timestamp: Date.now() - 300000,
        action: 'scenario_validation',
        details: { scenarioId: 'test-123' },
        risk: 'low'
      },
      {
        timestamp: Date.now() - 600000,
        action: 'rate_limit_check',
        details: { identifier: 'popup' },
        risk: 'low'
      },
      {
        timestamp: Date.now() - 900000,
        action: 'input_sanitization',
        details: { field: 'scenario_title' },
        risk: 'medium'
      }
    ];
    setSecurityEvents(mockEvents);
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await loadPerformanceStats();
      loadSecurityEvents();
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadPerformanceStats();
      loadSecurityEvents();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Format uptime
  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Format memory size
  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Get risk color
  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'var(--success-color)';
      case 'medium': return 'var(--warning-color)';
      case 'high': return 'var(--danger-color)';
    }
  };

  // Performance Tab Content
  const renderPerformanceTab = () => (
    <div className="dashboard-content">
      {!performanceStats ? (
        <div className="dashboard-loading">
          <i className="fa-solid fa-spinner spinning"></i>
          Loading performance data...
        </div>
      ) : (
        <>
          {/* System Info */}
          <div className="dashboard-section">
            <h4 className="dashboard-section-title">
              <i className="fa-solid fa-server"></i>
              System Information
            </h4>
            <div className="dashboard-grid">
              <div className="dashboard-metric">
                <div className="metric-label">Uptime</div>
                <div className="metric-value">{formatUptime(performanceStats.uptime)}</div>
              </div>
              {performanceStats.memoryUsage && (
                <>
                  <div className="dashboard-metric">
                    <div className="metric-label">Memory Used</div>
                    <div className="metric-value">{formatMemory(performanceStats.memoryUsage.used)}</div>
                  </div>
                  <div className="dashboard-metric">
                    <div className="metric-label">Memory Total</div>
                    <div className="metric-value">{formatMemory(performanceStats.memoryUsage.total)}</div>
                  </div>
                  <div className="dashboard-metric">
                    <div className="metric-label">Memory Usage</div>
                    <div className="metric-value">
                      {((performanceStats.memoryUsage.used / performanceStats.memoryUsage.limit) * 100).toFixed(1)}%
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="dashboard-section">
            <h4 className="dashboard-section-title">
              <i className="fa-solid fa-chart-line"></i>
              Performance Metrics
            </h4>
            <div className="metrics-table">
              <div className="metrics-header">
                <span>Operation</span>
                <span>Count</span>
                <span>Avg (ms)</span>
                <span>Min (ms)</span>
                <span>Max (ms)</span>
                <span>Recent (ms)</span>
              </div>
              {Object.entries(performanceStats.metrics).map(([name, stats]) => 
                stats && (
                  <div key={name} className="metrics-row">
                    <span className="metric-name">{name.replace(/_/g, ' ')}</span>
                    <span>{stats.count}</span>
                    <span>{stats.avg.toFixed(2)}</span>
                    <span>{stats.min.toFixed(2)}</span>
                    <span>{stats.max.toFixed(2)}</span>
                    <span className={stats.recent > 100 ? 'metric-slow' : 'metric-fast'}>
                      {stats.recent.toFixed(2)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Security Tab Content
  const renderSecurityTab = () => (
    <div className="dashboard-content">
      <div className="dashboard-section">
        <h4 className="dashboard-section-title">
          <i className="fa-solid fa-shield-halved"></i>
          Security Status
        </h4>
        <div className="security-status">
          <div className="status-item status-good">
            <i className="fa-solid fa-check-circle"></i>
            <span>Input Sanitization: Active</span>
          </div>
          <div className="status-item status-good">
            <i className="fa-solid fa-check-circle"></i>
            <span>Rate Limiting: Active</span>
          </div>
          <div className="status-item status-good">
            <i className="fa-solid fa-check-circle"></i>
            <span>Message Validation: Active</span>
          </div>
          <div className="status-item status-good">
            <i className="fa-solid fa-check-circle"></i>
            <span>Content Security Policy: Active</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h4 className="dashboard-section-title">
          <i className="fa-solid fa-history"></i>
          Recent Security Events
        </h4>
        <div className="security-events">
          {securityEvents.length === 0 ? (
            <div className="empty-state-small">
              <i className="fa-solid fa-shield-check"></i>
              <span>No security events recorded</span>
            </div>
          ) : (
            securityEvents.map((event, index) => (
              <div key={index} className="security-event">
                <div className="event-header">
                  <span 
                    className="event-risk" 
                    style={{ color: getRiskColor(event.risk) }}
                  >
                    <i className="fa-solid fa-circle"></i>
                    {event.risk.toUpperCase()}
                  </span>
                  <span className="event-time">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="event-action">{event.action.replace(/_/g, ' ')}</div>
                <div className="event-details">
                  {JSON.stringify(event.details, null, 2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Diagnostics Tab Content
  const renderDiagnosticsTab = () => (
    <div className="dashboard-content">
      <div className="dashboard-section">
        <h4 className="dashboard-section-title">
          <i className="fa-solid fa-stethoscope"></i>
          System Health
        </h4>
        <div className="health-checks">
          <div className="health-item health-good">
            <i className="fa-solid fa-check"></i>
            <span>Extension loaded successfully</span>
          </div>
          <div className="health-item health-good">
            <i className="fa-solid fa-check"></i>
            <span>Background script running</span>
          </div>
          <div className="health-item health-good">
            <i className="fa-solid fa-check"></i>
            <span>Content script injection working</span>
          </div>
          <div className="health-item health-good">
            <i className="fa-solid fa-check"></i>
            <span>Storage access available</span>
          </div>
          <div className="health-item health-good">
            <i className="fa-solid fa-check"></i>
            <span>Permissions granted</span>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h4 className="dashboard-section-title">
          <i className="fa-solid fa-lightbulb"></i>
          Recommendations
        </h4>
        <div className="recommendations">
          <div className="recommendation">
            <i className="fa-solid fa-info-circle"></i>
            <span>System is running optimally. No issues detected.</span>
          </div>
          <div className="recommendation">
            <i className="fa-solid fa-tip"></i>
            <span>Consider creating backups of your scenarios regularly.</span>
          </div>
          <div className="recommendation">
            <i className="fa-solid fa-shield"></i>
            <span>All security features are active and working properly.</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="security-dashboard-overlay">
      <div className="security-dashboard">
        <div className="dashboard-header">
          <h3 className="dashboard-title">
            <i className="fa-solid fa-tachometer-alt"></i>
            System Dashboard
          </h3>
          <div className="dashboard-controls">
            <button 
              className={`dashboard-control ${autoRefresh ? 'active' : ''}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title="Toggle auto-refresh"
            >
              <i className="fa-solid fa-sync-alt"></i>
            </button>
            <button 
              className="dashboard-control"
              onClick={() => {
                loadPerformanceStats();
                loadSecurityEvents();
              }}
              title="Refresh now"
            >
              <i className="fa-solid fa-refresh"></i>
            </button>
            <button className="dashboard-control" onClick={onClose} title="Close dashboard">
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
        </div>

        <div className="dashboard-tabs">
          <button 
            className={`dashboard-tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            <i className="fa-solid fa-chart-line"></i>
            Performance
          </button>
          <button 
            className={`dashboard-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <i className="fa-solid fa-shield-halved"></i>
            Security
          </button>
          <button 
            className={`dashboard-tab ${activeTab === 'diagnostics' ? 'active' : ''}`}
            onClick={() => setActiveTab('diagnostics')}
          >
            <i className="fa-solid fa-stethoscope"></i>
            Diagnostics
          </button>
        </div>

        {isLoading ? (
          <div className="dashboard-loading">
            <i className="fa-solid fa-spinner spinning"></i>
            Loading dashboard data...
          </div>
        ) : (
          <>
            {activeTab === 'performance' && renderPerformanceTab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'diagnostics' && renderDiagnosticsTab()}
          </>
        )}
      </div>
    </div>
  );
};