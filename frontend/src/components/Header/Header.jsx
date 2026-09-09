import React from 'react';
import { 
  Network, 
  Activity, 
  ShieldAlert, 
  GitPullRequest, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';

export default function Header({ 
  mode, 
  onReset, 
  onOpenValidation, 
  validationReport 
}) {
  const hasIssues = validationReport?.issues?.length > 0;

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand-icon-wrapper">
          <Network size={18} />
        </div>
        <div className="brand-text">
          <div className="brand-title-row">
            <span className="brand-title">Dependency Intelligence</span>
            <span className="brand-badge">UPS Enterprise</span>
          </div>
          <span className="brand-subtitle">API Topology &amp; Blast Radius Analyzer</span>
        </div>
      </div>

      <div className="header-center">
        {mode === 'NORMAL' && (
          <div className="system-status-indicator normal">
            <span className="status-dot green"></span>
            <span>Ecosystem Operational</span>
          </div>
        )}
        {mode === 'FAILURE_SIMULATION' && (
          <div className="system-status-indicator failure">
            <span className="status-dot red"></span>
            <span>Outage Blast Simulation Active</span>
          </div>
        )}
        {mode === 'CHANGE_IMPACT_ANALYSIS' && (
          <div className="system-status-indicator change">
            <span className="status-dot amber"></span>
            <span>Change Impact Analysis Active</span>
          </div>
        )}
      </div>

      <div className="header-right">
        {mode !== 'NORMAL' && (
          <button 
            className="btn btn-secondary" 
            onClick={onReset}
            title="Return to normal dependency exploration"
          >
            <RotateCcw size={13} />
            <span>Reset Analysis</span>
          </button>
        )}

        <button 
          className="btn btn-secondary"
          onClick={onOpenValidation}
          title="Inspect dataset schema &amp; normalization integrity"
        >
          {hasIssues ? (
            <>
              <AlertTriangle size={13} color="#f59e0b" />
              <span>Dataset Warnings ({validationReport.issues.length})</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={13} color="#10b981" />
              <span>Dataset Validated</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
