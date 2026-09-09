import React from 'react';
import { Activity, ShieldAlert, GitPullRequest, RefreshCw, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export default function Header({ 
  mode, 
  onReset, 
  onOpenValidation, 
  validationReport 
}) {
  const hasIssues = validationReport?.issues?.length > 0;

  return (
    <header className="app-header">
      <div className="header-branding">
        <div className="header-logo">
          <Layers size={22} />
        </div>
        <div className="header-titles">
          <h1>API Dependency Visualizer &amp; Change Impact Analyzer</h1>
          <p>Visualize enterprise service dependencies &amp; analyze downstream blast radius</p>
        </div>
      </div>

      <div className="header-actions">
        {mode === 'NORMAL' && (
          <div className="mode-badge normal">
            <Activity size={14} /> Normal Exploration
          </div>
        )}
        {mode === 'FAILURE_SIMULATION' && (
          <div className="mode-badge failure">
            <ShieldAlert size={14} /> Outage Simulation Active
          </div>
        )}
        {mode === 'CHANGE_IMPACT_ANALYSIS' && (
          <div className="mode-badge change">
            <GitPullRequest size={14} /> Change Impact Analysis Active
          </div>
        )}

        {mode !== 'NORMAL' && (
          <button className="btn btn-secondary" onClick={onReset} title="Reset simulation and return to graph exploration">
            <RefreshCw size={14} /> Reset Simulation
          </button>
        )}

        <button 
          className="btn btn-secondary"
          onClick={onOpenValidation}
          title="Inspect dataset validation status"
        >
          {hasIssues ? (
            <>
              <AlertTriangle size={14} color="#f59e0b" /> Dataset Warnings ({validationReport.issues.length})
            </>
          ) : (
            <>
              <CheckCircle2 size={14} color="#10b981" /> Dataset Loaded
            </>
          )}
        </button>
      </div>
    </header>
  );
}
